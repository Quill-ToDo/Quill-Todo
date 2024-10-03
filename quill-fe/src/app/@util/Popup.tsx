import { observer } from "mobx-react-lite";
import { 
    ComponentPropsWithoutRef, 
    createContext, 
    ForwardRefRenderFunction, 
    ReactElement, 
    ReactNode, 
    useContext, 
    useState 
} from "react";
import { combineClassNamePropAndString } from "./constants";
import { FloatingUiPopupImplementation, setUpFloatingUiStandalonePopup } from "../3rd-party/FloatingUiHelpers";
import "./popup.css"
import { ReferenceType } from "@floating-ui/react";

// Options used in both "anchor-tethered" and "standalone" popup types
export type SharedPopupProps = {
    position?: "centered" | "positioned",
    placement?: "left" | "bottom" | "right" | "top" | "centered",
    alignment?: "start" | "middle" | "end",
    doneLoading?: boolean,
    draggable?: boolean,
    useDragHandle?: boolean,
}
// Option 1: "Tethered" popups use render props to specify the popup content and anchor element to tether popup to.
// Popup will dismount when anchor element dismounts or when the close method is called.
export type RenderPopUpContent = ({
    closePopup, 
    dragHandleProps
}: {
    closePopup: ()=>void,
    dragHandleProps?: any,
}) => ReactElement<any>;
export type RenderAnchorElement = ForwardRefRenderFunction<HTMLButtonElement, {
    openPopup: () => void, 
    toApply: ComponentPropsWithoutRef<"button">,
}>;
export type TetheredPopupParams = {
    renderPopupContent: RenderPopUpContent,
    renderElementToClick: RenderAnchorElement,
} & SharedPopupProps;
// Option 2: "Standalone" popups only accepts content to popup and returns setup methods (open, close, anchor positioning ref).
// Popup will remain until the close method is called.
export type StandalonePopupParams = {
    children: ReactNode | JSX.Element,
} & SharedPopupProps;

/**
 * Given a render prop for an anchor element (provided a method to open popup) and the content to popup
 * (provided a method to close popup), and popup configuration options, return
 * the anchor ref element to be rendered.
 * If the anchor element is unmounted, the popup will as well. 
 * If this is not desired, use StandalonePopupOnClick instead.
 * 
 * # renderPopUpContent requirements:
 * If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class DRAGGABLE_HANDLE_CLASS to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return button element 
 * - apply passed ref to button element
 * - spread props in props.toApply to button element (as first parameter so they can be overridden if desired)
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString({
                            className: "your-class-name",
                            props: props.toApply})}` to include passed classNames.
 * - call `props.openPopup()` in an onClick method on returned button  
 * 
 * @returns the rendered anchor element for the popup
 */
export const TetheredPopupOnClick = observer((
    // helper to serve as an interface between Quill and any
    // 3rd party libraries.
    {   
        position="positioned",
        placement="right",
        alignment="middle",
        doneLoading=true, 
        draggable=false, 
        useDragHandle=false,
        ...props
    } : TetheredPopupParams) => {
        const defaultProps = {
            position: position,
            placement: placement,
            alignment: alignment,
            doneLoading: doneLoading,
            draggable: draggable,
            useDragHandle: useDragHandle,
        }
        return <FloatingUiPopupImplementation 
            {...props}
            {...defaultProps}
        />;
});

/**
 * Given the content to popup and popup configuration options, mount a popup to the DOM. 
 * This popup version returns a reference that an anchor element can use for positioning, but 
 * the popup will stay mounted even if the reference anchor element is unmounted from the DOM.
 * If the popup should dismount when an anchor element is, use TetheredPopupOnClick instead.
 * Also returns an open method to call when it should open the popup and a close
 * method to use in child popup content or as desired to close the popup.
 * 
 * # renderPopUpContent requirements:
 * If draggable=true and useDragHandle=true, one element in the renderPopUpContent callback must
 * have the class DRAGGABLE_HANDLE_CLASS to specify which element should be used as the handle.
 * 
 * # renderElementToClick requirements: 
 * - accept (props, ref) parameters
 * - return button element 
 * - apply passed ref to button element
 * - spread props in props.toApply to button element (as first parameter so they can be overridden if desired)
 * - If you want to add class names, do  
 * `className={combineClassNamePropAndString({
                            className: "your-class-name",
                            props: props.toApply})}` to include passed classNames.
 * - call `props.openPopup()` in an onClick method on returned button  
 * 
 * @returns the rendered anchor element for the popup
 */
export const setUpStandalonePopup = (
    {   
        position="positioned",
        placement="right",
        alignment="middle",
        doneLoading=true, 
        draggable=false, 
        useDragHandle=false,
        ...props
    } : StandalonePopupParams) : { 
        openPopup: () => void,
        closePopup: () => void,
        setPopupPositioningAnchor: ((node: ReferenceType | null) => void) & ((node: ReferenceType | null) => void),
    } => {
        // Popup helper to serve as an interface between Quill and
        // 3rd party libraries.
        const popupContext = useContext(StandalonePopupContext);
        const defaultProps = {
            position: position,
            placement: placement,
            alignment: alignment,
            doneLoading: doneLoading,
            draggable: draggable,
            useDragHandle: useDragHandle,
            setPopupContent: popupContext,
        }
        return setUpFloatingUiStandalonePopup({...props, ...defaultProps});
};



/**
 * Simple popup menu containing a list of clickable items. Add the property:
 * aria-haspopup="menu"
 * to the element returned by renderElementToClick for accessibility.
 */
export const ContextMenuPopup = observer((
    {   
        labelsAndClickCallbacks,
        renderElementToClick,
        header,
        placement="right",
        alignment="middle",
        ...props
    } : {
        labelsAndClickCallbacks: {
            label: string, // Accessibility, the name
            content: ReactElement<any>,  // Content to render inside <li> and button. ex: <>{ICONS.TRASH}<p>Delete</p></>
            onClick: () => void, 
            visible: boolean, // Should this element appear in the content menu?
        }[],
        renderElementToClick: RenderAnchorElement, // Must stay a callback
        header?: ReactElement<"any">, // Optional header content for the context menu
        placement?: "left" | "bottom" | "right" | "top",
        alignment?: "start" | "middle" | "end",
    }
) => {
    return <TetheredPopupOnClick
        renderElementToClick={renderElementToClick}
        renderPopupContent={({closePopup}) => 
            <menu
                role="menu"
            >
                { header }
                <ul>
                    { labelsAndClickCallbacks.filter(labelAndCallback => labelAndCallback.visible)
                    .map(labelAndCallback =>

                    <li key={labelAndCallback.label}>
                        <button
                                onClick={() => {
                                    labelAndCallback.onClick(); 
                                    closePopup( );
                                }}
                                aria-labelledby={labelAndCallback.label} 
                                title={labelAndCallback.label}
                                className={combineClassNamePropAndString({className: `item`, props: props})} 
                                > 
                                { labelAndCallback.content }
                            </button>
                    </li>
                )}
                </ul>
        </menu>
        }
        placement={placement}
        alignment={alignment}
        {...{className: "context-menu"}}> 
    </TetheredPopupOnClick>
})

export const StandalonePopupContext = createContext(() => {});
export const StandalonePopupContextProvider = ({children}: {
    children: ReactNode,
}) => {
    const [popupContent, setPopupContent] = useState(null);

    return <StandalonePopupContext.Provider
        value={setPopupContent}
    >
        { children }
        { popupContent }
    </StandalonePopupContext.Provider>
}
