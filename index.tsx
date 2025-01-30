import { ReactWidget, registerWidget, ExtractProperties } from "@cpmplus/widget-support/react";
import { When } from "client/common";
import { GetConnection, IConnection } from "client/connection";
import { StatusToString } from "client/data/valuestatus";
import { TGraphData } from "client/servertypes";
import { cDateTime } from "client/time";
import { cPropertyType, IComponentConfig, IProperty } from "componentbase/common";
import { Console } from "console";
import { cGraphDataAccessor } from "valueaccessors/graphdataaccessor";
import { ITimeBar } from "valueaccessors/historyvalueaccessor";
import { cTimeBar } from "widgets/timebar/timebar";
import { RequestSubKey } from "nls/nls";
import SpaceXLaunchesTable from "./SpaceXLaunchesTable";


interface TableDetails {
	Source: string,
	Instance: string,
	Property: string,
	Data: GraphData[]
}

interface GraphData {
	xValue: Date,
	yValue: number,
	status: string
}

interface WidgetData {
	TableDetails: TableDetails,
}

class Widget extends ReactWidget {





	public Data: IProperty<cGraphDataAccessor> = this.Properties.Add("Data",
		cPropertyType.Component, {
		Category: "General",
		Index: 1,
		ComponentType: "ABB.Mia.cGraphDataAccessor",
		IsBrowsable: true,
		IsSerializable: true,
		DefaultValue: new cGraphDataAccessor(), IsReadOnly: false //<-- the accessor component is "constant"
	});

	public TimeBar: IProperty<cTimeBar> = this.Properties.Add("TimeBar",
		cPropertyType.Widget, {
		Category: "General",
		Index: 2,
		ComponentType: "ABB.Mia.Widgets.cTimeBar",
		IsBrowsable: true,
		IsSerializable: true
	});

	ReactProperties = {
		name: "World"
	};

	constructor(container: HTMLElement, config: IComponentConfig) {
		super(container);
		this.Properties.Read(config);

		let timebar: ITimeBar = this.TimeBar.Get();
		const gdaccessorList = this.Data.Get();

		const connection: IConnection = GetConnection();

		// const x = GetConnection();
		// const language = x.GetConnectionInfo().Language

		// var lang = RequestSubKey("Enums", "LanguageNames", "@" + language);
		// console.log(lang.Data);

		// console.log(language);

		const inittimebar = () => {
			cleartimebar();
			timebar = this.TimeBar.Get();
			if (timebar) {
				timebar.Events.AddListener("TimeChanged", () => { reFetch(gdaccessorList); });
			}
		};

		const cleartimebar = () => {
			if (timebar && !timebar.IsDisposed()) {
				timebar.Events.RemoveListener("TimeChanged", () => { reFetch(gdaccessorList); });
			}
		};

		const reFetch = (gda: cGraphDataAccessor) => {
			gda.Parameters.XStart = timebar.Get("StartTime");
			gda.Parameters.XEnd = timebar.Get("EndTime");
			gda.FetchValues();
			When(gda, "Changed", () => {
				this.renderWidget(gda, connection);
			});
		}

		this.RefreshEvent.Then(() => {
			this.RefreshEvent.AddListener(() => {
				this.requestRender();
				this.renderWidget(gdaccessorList, connection);
			});
			this.TimeBar.OnChange(inittimebar);
			this.AddDisposeHandler(() => { cleartimebar(); });
			inittimebar();
			this.requestRender();
		});
		this.requestRender();
	}

	private renderWidget(gda: cGraphDataAccessor, connection: IConnection): void {
		const tableDetailsArray: TableDetails[] = [];
		var counter: number = 0;
		let buffer: TGraphData = gda.GetBuffer();
		const xdata: any[] = buffer[0]; //xData - time
		const ydata: unknown[] = buffer[1]; //yData - values
		const status: string[] = buffer[2];
		const graphData: GraphData[] = [];

		for (let i: number = 0; i < ydata.length; i++) {
			const dt = new cDateTime(BigInt(xdata[i]));
			const dt_formatted = dt.ToJSDate();
			const statusText = StatusToString(BigInt(status[i]), connection);
			var data: GraphData = { xValue: dt_formatted, yValue: ydata[i] as number, status: statusText };
			graphData.push(data);
		}
		// console.log(graphData);
		// this.ReactProperties.WidgetData.TableDetails = tableDetailsArray;
		// this.ReactProperties.WidgetData.TableStyles = {} as TableStyles;
		// this.ReactProperties.WidgetData.TableStyles.Theme = Theme.Name;
		this.requestRender();
	}
}

type Props = ExtractProperties<Widget>;

function Hello({ name }: Props) {

	return <div style={{ height: "100%", width: "100%" }}>
	<SpaceXLaunchesTable />
  </div>
  ;
}

registerWidget(Widget, Hello);