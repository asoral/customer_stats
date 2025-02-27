

from erpnext.accounts.report.customer_ledger_summary.customer_ledger_summary import execute
from erpnext.accounts.utils import get_fiscal_year
import frappe
from erpnext.accounts.party import get_party_account_currency
from erpnext.selling.doctype.customer.customer import Customer
from frappe.utils import (
	flt,
	getdate,
	nowdate,
)

@frappe.whitelist()
def get_payment_days(name):
    today = frappe.utils.today()
    last_year_date = frappe.utils.add_months(today, -12)
    days=get_avg_payment_days_cal(name,last_year_date,today)
    if days:
        return round(days,0)
    



def get_avg_payment_days_cal(party,from_date,to_date):
    filters={"party":party,"from_date":from_date,"to_date":to_date}
    a=execute(frappe._dict(filters))
    if a:
        if len(a)==2:
            total=a[-1]
            if total:
                total=total[0]
                adhfc=(total.get("opening_balance")+total.get("closing_balance"))/2
                if total.get("paid_amount")>0:
                    total_sales=(total.get("paid_amount")+total.get("return_amount"))/365
                    total_no_days=adhfc/total_sales
                else:
                    total_no_days=365
                return round(total_no_days,0)
    
def get_avg_payment_days(company,party,from_date,to_date):
    filters={"company":company,"party":party,"from_date":from_date,"to_date":to_date}
    a=execute(frappe._dict(filters))
    if a:
        if len(a)==2:
            total=a[-1]
            if total:
                total=total[0]
                adhfc=(total.get("opening_balance")+total.get("closing_balance"))/2
                if total.get("paid_amount")>0:
                    total_sales=(total.get("paid_amount")+total.get("return_amount"))/365
                    total_no_days=adhfc/total_sales
                else:
                    total_no_days=365
                return total_no_days



@frappe.whitelist()
def get_previous_year_billing(name,loyalty_program=None):
    previous_year_billing = get_dashboard_info('Customer',name,loyalty_program)
    return {"previous_year_billing":previous_year_billing if previous_year_billing else 0}
    


def get_previous_fiscal_year():
    current_date = nowdate()
    current_fiscal_year = get_fiscal_year(current_date, as_dict=True)
    previous_start_date = frappe.utils.add_years(current_fiscal_year['year_start_date'], -1)
    previous_fiscal_year = get_fiscal_year(previous_start_date, as_dict=True)
    
    return previous_fiscal_year

def get_dashboard_info(party_type, party, loyalty_program=None):
	# current_fiscal_year = get_fiscal_year(nowdate(), as_dict=True)
    current_fiscal_year = get_previous_fiscal_year()


    doctype = "Sales Invoice" if party_type == "Customer" else "Purchase Invoice"

    companies = frappe.get_all(
        doctype, filters={"docstatus": 1, party_type.lower(): party}, distinct=1, fields=["company"]
    )
    company_wise_grand_total = frappe.get_all(
        doctype,
        filters={
            "docstatus": 1,
            party_type.lower(): party,
            "posting_date": (
                "between",
                [current_fiscal_year.year_start_date, current_fiscal_year.year_end_date],
            ),
        },
        group_by="company",
        fields=[
            "company",
            "sum(grand_total) as grand_total",
            "sum(base_grand_total) as base_grand_total",
        ],
    )

    if party_type == "Customer":
        loyalty_point_details = frappe._dict(
            frappe.get_all(
                "Loyalty Point Entry",
                filters={
                    "customer": party,
                    "expiry_date": (">=", getdate()),
                },
                group_by="company",
                fields=["company", "sum(loyalty_points) as loyalty_points"],
                as_list=1,
            )
        )

    company_wise_billing_this_year = frappe._dict()

    for d in company_wise_grand_total:
        company_wise_billing_this_year.setdefault(
            d.company, {"grand_total": d.grand_total, "base_grand_total": d.base_grand_total}
        )

    for d in companies:
        company_default_currency = frappe.db.get_value("Company", d.company, "default_currency")
        party_account_currency = get_party_account_currency(party_type, party, d.company)

        if party_account_currency == company_default_currency:
            billing_this_year = flt(company_wise_billing_this_year.get(d.company, {}).get("base_grand_total"))
        else:
            billing_this_year = flt(company_wise_billing_this_year.get(d.company, {}).get("grand_total"))

        info = {}
        info["billing_this_year"] = flt(billing_this_year) if billing_this_year else 0

        return info["billing_this_year"]



# @frappe.whitelist()
# def get_avg_payment_days_without_dunnings(name):
#     payments = frappe.db.sql("""
#         SELECT AVG(DATEDIFF(pe.posting_date, si.posting_date)) as avg_days
#         FROM `tabPayment Entry` pe
#         JOIN `tabPayment Entry Reference` per ON per.parent = pe.name
#         JOIN `tabSales Invoice` si ON per.reference_name = si.name
#         WHERE pe.party = %s 
#         AND si.status = 'Paid' 
#         AND per.reference_doctype = 'Sales Invoice'
#         AND NOT EXISTS (
#             SELECT 1 FROM `tabDunning` d WHERE d.sales_invoice = si.name AND d.docstatus = 1
#         )
#     """, (name,), as_dict=True)

#     return round(payments[0].avg_days) if payments and payments[0].avg_days else 0


@frappe.whitelist()
def get_avg_payment_days_without_dunnings(name):
    payments = frappe.db.sql("""
        SELECT si.name AS invoice, pe.name AS payment_entry, si.posting_date AS invoice_date, 
               pe.posting_date AS payment_date, DATEDIFF(pe.posting_date, si.posting_date) AS days_diff
        FROM `tabPayment Entry` pe
        JOIN `tabPayment Entry Reference` per ON per.parent = pe.name
        JOIN `tabSales Invoice` si ON per.reference_name = si.name
        WHERE pe.party = %s 
        AND si.status = 'Paid' 
        AND per.reference_doctype = 'Sales Invoice'
        AND NOT EXISTS (
            SELECT 1 FROM `tabDunning` d WHERE d.sales_invoice = si.name AND d.docstatus = 1
        )
    """, (name,), as_dict=True)

    total_days = 0
    count = 0

    for payment in payments:
        
        total_days += payment.days_diff
        count += 1

    avg_days = round(total_days / count) if count > 0 else 0

    
    return avg_days
@frappe.whitelist()
def get_total_dunning_amount(name):
    """Calculates the total outstanding amount for unresolved dunning records."""
    
    query = """
        SELECT d.name AS dunning_entry, d.grand_total
        FROM `tabDunning` d
        WHERE d.customer = %s
        AND d.status = 'Unresolved'
    """
    
    results = frappe.db.sql(query, (name,), as_dict=True)

    total_dunning = sum(dunning.grand_total for dunning in results) if results else 0

    for dunning in results:
        

     return total_dunning

