import frappe
from frappe.desk.doctype.dashboard_chart.dashboard_chart import get_aggregate_function




def get_group_by_chart_config(chart, filters) -> dict | None:
	aggregate_function = get_aggregate_function(chart.group_by_type)
	value_field = chart.aggregate_function_based_on or "1"
	group_by_field = chart.group_by_based_on
	doctype = chart.document_type

	data = frappe.get_list(
		doctype,
		fields=[
			f"{group_by_field} as name",
			{aggregate_function: value_field, "as": "count"},
		],
		filters=filters,
		parent_doctype=chart.parent_document_type,
		group_by=group_by_field if "." in group_by_field else f"`tab{doctype}`.`{group_by_field}`",
		order_by="count desc",
		ignore_ifnull=True,
	)

	group_by_field_field = frappe.get_meta(doctype).get_field(
		group_by_field
	)  # get info about @group_by_field

	# if data and group_by_field_field.fieldtype == "Link":  # if @group_by_field is link
	if data and group_by_field_field and group_by_field_field.fieldtype == "Link":
		title_field = frappe.get_meta(group_by_field_field.options)  # get title field
		if title_field.title_field:  # if has title_field
			for item in data:  # replace chart labels from name to title value
				item.name = frappe.get_value(group_by_field_field.options, item.name, title_field.title_field)

	if data:
		return {
			"labels": [item.get("name", "Not Specified") for item in data],
			"datasets": [{"name": chart.name, "values": [item["count"] for item in data]}],
		}
	return None
