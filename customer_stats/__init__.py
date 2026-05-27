__version__ = "0.0.1"

import frappe
from frappe.desk.doctype.dashboard_chart import dashboard_chart as chart
from customer_stats.overrides.custom_dashbord_chart import get_group_by_chart_config

chart.get_group_by_chart_config = get_group_by_chart_config