import { ReactWidget, registerWidget, ExtractProperties } from "@cpmplus/widget-support/react";
import { cComponentBase, Components, cPropertyType, IComponentConfig, IProperty } from "componentbase/common";
import DynamicTable from "./DynamicTable";
import { IWidgetBaseConfig } from "widgetbase/widgetbase";
import { INLSEnum, Enums } from "nls/enums";
import { AddConnectionSupport, IConnectionAPI } from "componentbase/connectionsupport";
import { IDbCacheConnection } from "db/cache";

enum ColumnType {
	URL = 1,
	Image = 2,
	Date = 3,
	String = 4,
	Boolean = 5
}

//Create a constant with INLSEnum type by adding to Enums and this can be used while creating Enum type widget property
const TableColumnType: INLSEnum = Enums.Add("DynamicTable.ColumnType", ColumnType);

class ColumnNames extends cComponentBase {

	public Name: IProperty<string> = this.Properties.Add("Name", cPropertyType.Text, {
		IsSerializable: true,
		IsBrowsable: true,
		ItemType: cPropertyType.Text
	});

	public ID: IProperty<string> = this.Properties.Add("ID", cPropertyType.Text, {
		IsSerializable: true,
		IsBrowsable: true,
		ItemType: cPropertyType.Text
	});

	public Column_Label: IProperty<string> = this.Properties.Add("Label", cPropertyType.Text, {
		IsSerializable: true,
		IsBrowsable: true,
		ItemType: cPropertyType.Text
	});

	public Column_Type: IProperty<ColumnType> = this.Properties.Add("Column Type", cPropertyType.Enum, {
		IsSerializable: true,
		IsBrowsable: true,
		EnumType: TableColumnType,
		DefaultValue: ColumnType.String
	});

	constructor(config: IWidgetBaseConfig) {
		super();
		this.Properties.Read(config);
	}
}
Components.Add(ColumnNames, "SchemaComponent.ColumnNames");


interface IReactProperties {
	apiUrl: string;
	idField: string;
	columns: IColumnConfig[];
}

interface IColumnConfig {
	id: string;
	label: string;
	isLink?: boolean;
	isImage?: boolean;
	format?: (value: any) => string;
}

class Widget extends ReactWidget {
	private API_Schema: IProperty<ColumnNames[]> = this.Properties.Add(
		"Column Names", cPropertyType.Array, {
		Category: 'General',
		Description: "Columns to Show in the Data List as per API schema",
		IsBrowsable: true,
		IsSerializable: true,
		ItemType: cPropertyType.Component,
		ComponentType: 'SchemaComponent.ColumnNames',
		DefaultValue: []
	}
	);

	private API_URL: IProperty<string> = this.Properties.Add(
		"API URL", cPropertyType.Text, {
		Category: "General",
		Description: "Enter the API endpoint to fetch data",
		IsBrowsable: true,
		IsSerializable: true,
		DefaultValue: ""
	}
	);

	private TEMP: IProperty<string> = this.Properties.Add(
		"TEMP", cPropertyType.Text, {
		Category: "General",
		Description: "Enter the API endpoint to fetch data",
		IsBrowsable: true,
		IsSerializable: true,
		DefaultValue: ""
	}
	);

	private ID_FIELD: IProperty<string> = this.Properties.Add(
		"ID Field", cPropertyType.Text, {
		Category: "General",
		Description: "Enter the unique ID field name from the API response",
		IsBrowsable: true,
		IsSerializable: true,
		DefaultValue: "id"
	}
	);

	// ✅ Declare ReactProperties but do NOT initialize it inside the class
	public ReactProperties: IReactProperties = {
		apiUrl: "",
		idField: "",
		columns: [],
	};

	private conn: IDbCacheConnection = null;

	Connection: IConnectionAPI = AddConnectionSupport(this);

	constructor(container: HTMLElement, config: IComponentConfig) {
		super(container);
		this.Properties.Read(config);

		this.RefreshEvent.Then(() => {
			this.RefreshEvent.AddListener(() => {
				this.renderWidget();
			});
			this.AddDisposeHandler(() => { /* Cleanup if needed */ });
			this.renderWidget();
		});

		this.TEMP.OnChange(() => {
			this.fetchClassInstances()
				.then(classInstances => {
					if (classInstances.length > 0) {
						console.log("Fetched class instances:", classInstances);
						classInstances.forEach(x=>{
							if(x["Parent"] == "160ee230-f4ff-4308-b574-85ab8f38558e"){
								console.log(x);
							}
						})
					} else {
						console.log("No class instances found.");
					}
				})
				.catch(error => console.error("Error occurred while fetching class instances:", error));
		});
	}

	async fetchClassInstances(): Promise<Array<Record<string, any>>> {
		try {
			this.conn = this.Connection.Get() as IDbCacheConnection;
			if (!this.conn) {
				console.error("Error: Unable to establish connection.");
				return [];
			}

			// Fetch instances asynchronously
			const classInstances = await this.conn.FetchClassInstances("Path", -1);

			console.log("classInstances ::", classInstances);

			// Ensure the result is an array before returning
			if (!Array.isArray(classInstances)) {
				console.error("Error: classInstances is not an array!", classInstances);
				return [];
			}

			console.log(`Retrieved ${classInstances.length} class instances.`);
			return classInstances; // Returning array of objects

		} catch (error) {
			console.error("Error fetching class instances:", error);
			return []; // Return empty array on failure
		}
	}

	private processInstances(): void {
		try {


			const instances = this.conn?.Classes?.["Path"]?.Instances?.GetInstanceSet();
			console.log("Instances retrieved:", instances);

			if (instances != null) {
				if (instances.length > 0) {
					instances.forEach(instance => {
						const parent = String(instance?.["Parent"] || ""); // Force string conversion safely
						console.log(`Checking instance:`, instance);

						if (parent === "Location") {
							const name = String(instance?.["Name"] || "");
							const equipment = String(instance?.["Equipment"] || "");

							console.log(`${name}::${equipment}`);
						}
					});
				}
			}
		} catch (error) {
			console.error("Error processing instances:", error);
		}
	}

	// ✅ Assign ReactProperties inside renderWidget()
	private renderWidget(): void {

		//this.processInstances();
		this.conn = this.Connection.Get() as IDbCacheConnection;
		this.conn.Classes

		const apiUrl = this.API_URL.Get();
		const idField = this.ID_FIELD.Get();
		const columns = this.API_Schema.Get().map(col => ({
			id: col.ID.Get(),
			label: col.Column_Label.Get() || col.ID.Get(),
			isLink: col.Column_Type.Get() === ColumnType.URL,
			isImage: col.Column_Type.Get() === ColumnType.Image,
			format: col.Column_Type.Get() === ColumnType.Date
				? (value: string) => new Date(value).toLocaleDateString()
				: undefined,
		}));

		// ✅ Assign values dynamically
		this.ReactProperties = { apiUrl, idField, columns };

		// console.log("API URL:", apiUrl);
		// console.log("ID Field:", idField);
		// console.log("Columns:", columns);

		this.requestRender();
	}
}

// Extract Widget Properties
type Props = ExtractProperties<Widget>;

// ✅ Pass ReactProperties dynamically
function Hello({ apiUrl, idField, columns }: Props) {
	return (
		<div style={{ height: "100%", width: "100%" }}>
			<DynamicTable apiUrl={apiUrl} idField={idField} columns={columns} />
		</div>
	);
}

// Register Widget
registerWidget(Widget, Hello);