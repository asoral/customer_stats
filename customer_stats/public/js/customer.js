frappe.ui.form.on("Customer", {
    refresh: function (frm) {
        frm.events.make_custom_buttons(frm);
    },
    make_custom_buttons: function (frm) {
        frm.add_custom_button("Event", () => {
            let d = new frappe.ui.Dialog({
                title: 'Enter details',
                fields: [
                    {
                        label: 'Category',
                        fieldname: 'event_category',
                        fieldtype: 'Select',
                        options:["Event","Meeting","Call","Sent/Received Email","Other"],
                        default:"Event"
                    },
                    {
                        label: 'Next Step',
                        fieldname: 'next_step',
                        fieldtype: 'Select',
                        options:[
                            "Qualify Customer",
                            "Qualify Decision Maker",
                            "Ask for Filter List / Frequency / Price",
                            "Proposal Follow-Up / Ask for Order",
                            "Schedule Reorder / Follow-Up / Blanket Order",
                            "Follow-Up"],
                        reqd:1
                    },
                    {
                        label: 'Public',
                        fieldname: 'public',
                        fieldtype: 'Check',
                        default:1
                    },
                    {
                        fieldname: 'column_break_123',
                        fieldtype: 'Column Break'
                    },
                    {
                        label: 'Date',
                        fieldname: 'date',
                        fieldtype: 'Datetime',
                        reqd:1
                    },
                    {
                        label: 'Assigned To',
                        fieldname: 'assigned_to',
                        fieldtype: 'Link',
                        options:'User'
                    },
                    {
                        fieldname: 'section_break_123',
                        fieldtype: 'Section Break'
                    },
                    {
                        label: 'Summary',
                        fieldname: 'summary',
                        fieldtype: 'Data',
                        reqd:1
                    },
                    {
                        fieldname: 'section_break_1234',
                        fieldtype: 'Section Break'
                    },
                    {
                        label: 'Description',
                        fieldname: 'description',
                        fieldtype: 'Text Editor'
                    },
                    {
                        fieldname: 'section_break_1234',
                        fieldtype: 'Section Break'
                    },
                    {
                        label: 'Attachment',
                        fieldname: 'attachment',
                        fieldtype: 'Attach'
                    },

                ],
                size: 'large', // small, large, extra-large 
                primary_action_label: 'Submit',
                primary_action(values) {
                    frappe.call({
                        method:"florence.quotation.update_doc",
                        args:{
                            "values":values,
                            "reference_docname":frm.doc.name,
                            "reference_doctype":frm.doc.doctype
                        },
                        callback:function(r){
                            frm.refresh()
                            
                        }
                    })
                    d.hide();
                }
            });
            
            d.show();
        })
    }
})

$.extend(erpnext.utils, {
	set_party_dashboard_indicators: function (frm) {
        console.log("Stast code overrided by Customer Stats App");
        if (frm.doc.__onload && frm.doc.__onload.dashboard_info) {
			var company_wise_info = frm.doc.__onload.dashboard_info;
			if (company_wise_info.length > 1) {
				company_wise_info.forEach(function (info) {
					erpnext.utils.add_indicator_for_multicompany(frm, info);
				});
			} else if (company_wise_info.length === 1) {
				frm.dashboard.add_indicator(
					__("Annual Billing: {0}", [
						format_currency(
							company_wise_info[0].billing_this_year,
							company_wise_info[0].currency
						),
					]),
					"blue"
				);
				frm.dashboard.add_indicator(
					__("Total Unpaid: {0}", [
						format_currency(company_wise_info[0].total_unpaid, company_wise_info[0].currency),
					]),
					company_wise_info[0].total_unpaid ? "orange" : "green"
				);

				if (company_wise_info[0].loyalty_points) {
					frm.dashboard.add_indicator(
						__("Loyalty Points: {0}", [company_wise_info[0].loyalty_points]),
						"blue"
					);
				}

                frappe.call({
                    "method":"florence.florence.customer.get_previous_year_billing",
                    args:{
                        "name":frm.doc.name,
                        "loyalty_program":frm.doc.loyalty_program
                    },
                    async:false,
                    callback:function(r){
                        if(r.message){
                            frm.dashboard.add_indicator(__('Previous Year Billing: {0}',
                                [
                                    format_currency(
                                        r.message.previous_year_billing,
                                        company_wise_info[0].currency
                                    )
                                ]), 'blue');
                                
                        }
                    }
                })
                
                frappe.call({
                    "method":"florence.florence.customer.get_payment_days",
                    args:{
                        "name":frm.doc.name
                    },
                    callback:function(r){                        
                        if(r.message){
                            frm.dashboard.add_indicator(__('Average Days to Pay: {0}',
                                [r.message]), 'blue');
                        }
                    }
                })

			}
		}
    }}
)
