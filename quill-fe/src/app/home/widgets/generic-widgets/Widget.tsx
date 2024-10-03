import { getSessionStorageItem, setSessionStorageItem } from "@/app/@util/SessionStorageHelper";
import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    ReactElement, 
    ReactNode, 
    RefObject, 
    useState
 } from "react";

interface WidgetProps extends ComponentPropsWithoutRef<any> {
    widgetName: string;
    icon: ReactElement;
    loadingContent?: ReactNode;
    doneLoading: boolean;
    children: ReactElement;
    ref?: RefObject<any>;
    props?: ComponentPropsWithoutRef<any>;
}

export const setWidgetSessionStorageData = ({widgetName, itemKey, value}: {widgetName: string, itemKey: string, value: any}) => {
    setSessionStorageItem(`widget-${widgetName}-${itemKey}`, value);
} 

export const getWidgetSessionStorageData = ({widgetName, itemKey}: {widgetName: string, itemKey: string}) => {
    return getSessionStorageItem(`widget-${widgetName}-${itemKey}`);
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

    return <section 
        aria-label={widgetName} 
        className={`${widgetName.toLocaleLowerCase().replace(" ", "-")} widget`} 
        {...props}
        >
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