frappe.ui.form.on("Customer", {
    refresh: function (frm) {

    }
})

$.extend(erpnext.utils, {
	set_party_dashboard_indicators: function (frm) {
        console.log("Customer Stats overrided by Customer Stats App");
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
                    "method":"customer_stats.overrides.customer.get_previous_year_billing",
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
                                ]), 
                            'blue');      
                        }
                    }
                })
                
                frappe.call({
                    "method":"customer_stats.overrides.customer.get_payment_days",
                    args:{
                        "name":frm.doc.name
                    },
                    callback:function(r){                        
                        if(r.message){
                            frm.dashboard.add_indicator(__('Average Payment Days (With Dunnings): {0}',
                                [r.message]), 'blue');
                        }
                    }
                })
                    frappe.call({
                        method: "customer_stats.overrides.customer.get_avg_payment_days_without_dunnings",
                        args: {
                            name: frm.doc.name
                        },
                        callback: function (r) {
                            frm.dashboard.add_indicator(__('Average Payment Days (Without Dunnings): {0}', [r.message ?? 0]), 'blue');
                        }
                    });

                    // Fetch Total Dunning Amount
                    frappe.call({
                        method: "customer_stats.overrides.customer.get_total_dunning_amount",
                        args: {
                            name: frm.doc.name
                        },
                        callback: function (r) {
                            frm.dashboard.add_indicator(__('Total Dunning Amount: {0}', [
                                format_currency(r.message ?? 0, company_wise_info[0].currency)
                            ]), 'red');
                        }
                    });

			}
		}
    }}
)















// frappe.ui.form.on("Customer", {
//     refresh: function (frm) {}
// });

// $.extend(erpnext.utils, {
//     set_party_dashboard_indicators: function (frm) {
//         console.log("Customer Stats overridden by Customer Stats App");
//         if (frm.doc.__onload && frm.doc.__onload.dashboard_info) {
//             var company_wise_info = frm.doc.__onload.dashboard_info;
//             if (company_wise_info.length > 1) {
//                 company_wise_info.forEach(function (info) {
//                     erpnext.utils.add_indicator_for_multicompany(frm, info);
//                 });
//             } else if (company_wise_info.length === 1) {
//                 frm.dashboard.add_indicator(
//                     __("Annual Billing: {0}", [
//                         format_currency(
//                             company_wise_info[0].billing_this_year,
//                             company_wise_info[0].currency
//                         ),
//                     ]),
//                     "blue"
//                 );

//                 frm.dashboard.add_indicator(
//                     __("Total Unpaid: {0}", [
//                         format_currency(company_wise_info[0].total_unpaid, company_wise_info[0].currency),
//                     ]),
//                     company_wise_info[0].total_unpaid ? "orange" : "green"
//                 );

//                 frm.dashboard.add_indicator(
//                     __("Loyalty Points: {0}", [company_wise_info[0].loyalty_points || 0]),
//                     "blue"
//                 );

//                 // Fetch Previous Year Billing
//                 frappe.call({
//                     method: "customer_stats.overrides.customer.get_previous_year_billing",
//                     args: {
//                         name: frm.doc.name,
//                         loyalty_program: frm.doc.loyalty_program
//                     },
//                     async: false,
//                     callback: function (r) {
//                         frm.dashboard.add_indicator(__('Previous Year Billing: {0}', [
//                             format_currency(r.message?.previous_year_billing || 0, company_wise_info[0].currency)
//                         ]), 'blue');
//                     }
//                 });

//                 // Fetch Average Days to Pay
//                 frappe.call({
//                     method: "customer_stats.overrides.customer.get_payment_days",
//                     args: {
//                         name: frm.doc.name
//                     },
//                     callback: function (r) {
//                         frm.dashboard.add_indicator(__('Average Days to Pay: {0}', [r.message ?? 0]), 'blue');
//                     }
//                 });

//                 // Fetch Avg Payment Days (Without Dunnings)
//                 frappe.call({
//                     method: "customer_stats.overrides.customer.get_avg_payment_days_without_dunnings",
//                     args: {
//                         name: frm.doc.name
//                     },
//                     callback: function (r) {
//                         frm.dashboard.add_indicator(__('Avg Payment Days (Without Dunnings): {0}', [r.message ?? 0]), 'blue');
//                     }
//                 });

//                 // Fetch Total Dunning Amount
//                 frappe.call({
//                     method: "customer_stats.overrides.customer.get_total_dunning_amount",
//                     args: {
//                         name: frm.doc.name
//                     },
//                     callback: function (r) {
//                         frm.dashboard.add_indicator(__('Total Dunning Amount: {0}', [
//                             format_currency(r.message ?? 0, company_wise_info[0].currency)
//                         ]), 'red');
//                     }
//                 });
//             }
//         }
//     }
// });
