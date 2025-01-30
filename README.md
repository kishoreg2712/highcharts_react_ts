# highcharts_react_ts

This is a dashboard widget for ABB Ability History View, created using
`create-view-widget` and the template `react-ts`.

## Getting started

Run the following command in this directory:

```
npm install
```

Now opening or reloading the Ability History View web application, the new
widget should be available for adding to a dashboard in editing mode, under
the category "My widgets". The category name is configured in
[mdw.json](mdw.json) along with the widget's class name and either one can be
changed to any other name.

To have the widget update when reloading the web application during
development, you can leave this command running:

```
npm run watch
```

## Build system

Source code is transpiled from TypeScript, TSX or JSX and bundled in AMD
module format using Vite, configured in
[vite.config.ts](vite.config.ts)

Bundled output is generated in the `dist` directory. The `create-view-widget`
install script should have added a symbolic link (junction in Windows) to
that directory from `view/widgets/create-widget-dist/highcharts_react_ts` under History
View's `wwwroot`.

Only with the link present, the currently running History View is able to
find the built JavaScript bundle in the `dist` directory. When distributing
developed widgets to other systems, it's only necessary to include the files
under `dist` and instead of linking, they should be copied anywhere inside
`view/widgets` under History View's `wwwroot` where it will find them.

However, keep in mind that the widget's identity in saved dashboards is
determined by its file name and path under `view/widgets` so if it's moved to
a new location, it will disappear from existing saved dashboards. Before
designing any dashboards intended for long-term use, it's better to move the
files to their final location already during development.

## Coding style

Within this widget codebase, classes and types use PascalCase. Variables and
methods use camelCase. Indentation uses tabs. These conventions can be
changed at will. In the History View API, classes, methods and other class
members use PascalCase, method parameter names are all lowercase.

## Developing React widgets

React-based widgets should import a base class and extend it like so:

```
import { ReactWidget, registerWidget } from "@cpmplus/widget-support/react";

export class Widget extends ReactWidget {}
```

Then the simplest React function component would be to write:

```
function Empty() {
  return <div></div>;
}

registerWidget(Widget, Empty);
```

It will now render an empty box. To do anything interesting with existing
data, it should be passed to the function component using properties, through
which the component can also then optionally modify data. There are three main
ways to store data in the `Widget` class that gets passed to the React
component for rendering. We assume that application state is always handled by
View which has a suitable RTDB and serialized property system for the purpose.

### 1. Props inside a plain object

The simplest way to store and pass properties is using an object referenced in
a `ReactProperties` field of the class:

```
export class Widget extends ReactWidget {
  ReactProperties = {
    count: 1
  };
}
```

It must be called `ReactProperties` for automatic rendering
and TypeScript typings to work. For the function component it's possible to
automatically detect property types:

```
export type Props = ExtractProperties<Widget>;
```

Then the function component can use the properties like so:

```
function Counter({count, setCount}: Props) {
  return <button onClick={() => setCount(count + 1)}>
    Count: {count}
  </button>;
}

registerWidget(Widget, Counter);
```

Each property is accompanied by a setter, with the `set` prefix. Mentioning it
in the code or using it is optional, and allows modifying the value stored in
the widget.

Props stored in a plain object are not automatically saved anywhere and will
get reset for example when switching to/from edit mode.

### 2. Props in widget properties

All widget properties are also exposed to React. The above `Widget` class
could be changed to:

```
import { cPropertyType } from "componentbase/common";

export class Widget extends ReactWidget {
  public readonly count = this.Properties.Add<number>(
    "count",
    cPropertyType.Number,
    {
      Description: "Counter value",
      DefaultValue: 1,
      Category: "General",
      UseNLS: true,
      IsSerializable: true,
      IsBrowsable: true,
      IsReadOnly: false
    }
  );
}
```

No changes are needed to the React component or the `Props` type.
Now the counter works as before, but remembers its state when switching
to/from edit mode and gets stored in the database as a property of the widget
when saving the dashboard. It can also be edited for example with a Single
Property editor widget and the React component gets re-rendered when the
property changes.

### 3. Props in RTDB instance current values

For example RTDB variables are also referenced using a widget property:

```
import { cPropertyType } from "componentbase/common";
import { cCurrentValueAccessor } from "valueaccessors/currentvalueaccessor";

export class Widget extends ReactWidget {
  public readonly count = this.Properties.Add<cCurrentValueAccessor>(
    "count",
    cPropertyType.Component,
    {
      Description: "Counter value accessor",
      DefaultValue: new cCurrentValueAccessor(),
      Category: "General",
      IsNullable: false,
      IsSerializable: true,
      IsBrowsable: true,
      ComponentType: "ABB.Mia.cSingleValueAccessorBase"
    }
  );
}
```

Now it doesn't reference any particular value immediately after adding the
widget to the dashboard, so the `count` property needs to be configured from
the user interface first. After configuring it to access for example a
database variable, updating the value now persists between page loads without
having to explicitly save anything.
