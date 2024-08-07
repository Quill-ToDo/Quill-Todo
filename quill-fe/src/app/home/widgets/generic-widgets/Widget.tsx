import { combineClassNamePropAndString } from "@/app/@util/constants";
import { observer } from "mobx-react-lite";
import { Children, ComponentPropsWithoutRef, ComponentPropsWithRef, ReactElement, ReactNode, RefObject, useId, useRef, useState } from "react";

interface WidgetProps extends ComponentPropsWithoutRef<any> {
    widgetName: string;
    icon: ReactElement;
    loadingContent?: ReactNode;
    doneLoading: boolean;
    children: ReactElement;
    ref?: RefObject<any>;
    props?: ComponentPropsWithoutRef<any>;
}

export const Widget = observer((
    {
        widgetName,
        icon, 
        doneLoading,
        loadingContent,
        children,
        ...props 
    } : WidgetProps) => {

    const loading = loadingContent ? loadingContent :
    <div className="loading">
        { icon }
        <p>Loading {widgetName}</p>
    </div>;

    return <section title={widgetName} className={`${widgetName} widget`} {...props}>
        { doneLoading ? children : loading }
    </section>;
});

export const PlaceableWidget = observer(({   
            icon,
            widgetName,
            resizable=false,
            loadingContent,
            children,
            ...props
        }: WidgetProps & { resizable?: boolean } ) => {
    const [x, setX] = useState();
    const [y, setY] = useState();
    const [width, setWidth] = useState();
    const [height, setHeight] = useState();

    const loading = loadingContent ? loadingContent :
        <div className="loading take-full-space">
            <div>
                { icon }
                <p>Loading {widgetName}...</p>
            </div>
        </div>;

    return <Widget 
        widgetName={widgetName}
        icon={icon}
        loadingContent={loading}
        {...props}>
        {children}
    </Widget>
});