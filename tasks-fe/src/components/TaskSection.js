import React from "react";
import TaskSectionContent from "./TaskSectionContent";
class OneTaskSection extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            title: this.props.title, 
            // The title of the section
            section_number: this.props.section_num, 
            // The number this section appears at in the list of sections, used in it's id. 
            // Makes queries for this element easier
            section_content: this.props.section_content,
            // The actual content of this section. If there are several content sections (ex: "Due" and "Work"), include several 
            // dictionaries in the list.
            // Format as a list of dictionary elements with keys:
            // {
            //     optional_title= "",  // A subtitle that can appear before the content section
            //     tasks= [],
                // empty_text= ""  // Text that appears in the content section if there are no tasks
            // }
            section_toggle_duration: 100 
            // How long it should take for the section collapse animation
        };  

        // Ensure that "this" works properly in these methods
        this.handleSectionToggle = this.handleSectionToggle.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount () {
        const task_section = document.getElementById(this.getSectionId());
        const outer_section = task_section.querySelector(".mid-section");
        const inner_section = task_section.getElementsByClassName("section-collapsible")[0];
        inner_section.style.transition = `transform ${this.state.section_toggle_duration * .98}ms ease-in-out 0s`;
        outer_section.style.transition = `height ${this.state.section_toggle_duration}ms ease-in-out 0s`;
        outer_section.style.height = "fit-content";
    }

    toggleInlineHeightAttribute (outer_section) {
        // Add an inline height attribute equal to the original height
        // If I don't do this (add the computed inline height attribute) then the height transition animation 
        // wont work the first time you click the section title to collapse it.
        if (outer_section.style.height === "fit-content") {
            // Set inline height attribute
            const outer_height = parseFloat(window.getComputedStyle(outer_section).getPropertyValue('height'));
            outer_section.style.height = outer_height + "px";
        }
        else {
            // Remove inline height attribute (after animation is done so that the section will respond properly to window resizes)
            outer_section.style.height = "fit-content";
        }
    }

    getSectionId() {
        return "task-section-" + this.state.section_number;
    }

    handleSectionToggle (event, duration = this.state.section_toggle_duration) {
        // Collapse/expand sections on click 
        var task_section = document.getElementById(this.getSectionId())
        this.toggleSection(task_section, duration);
        this.flipKarat(task_section, duration);
    }

    toggleSection(task_section, duration) {
        var outer_section = task_section.querySelector(".mid-section");
        var inner_content = task_section.querySelector(".section-collapsible");
        
        this.toggleInlineHeightAttribute(outer_section);

        const section_header_height = parseFloat(window.getComputedStyle(task_section.querySelector(".expandable-section-header")).getPropertyValue('height'));

        if (inner_content.style.display === "none") {
            // Expand
            inner_content.style.display = "block";
            const section_content_height = parseFloat(window.getComputedStyle(inner_content).getPropertyValue('height'));
            setTimeout(() => {
                // For some reason it needs a timeout after switching to block display before transforming
                // Works when theres a breakpoint after....
                outer_section.style.height = (section_header_height + section_content_height) + "px";
                inner_content.style.transform = "scaleY(1)";
            }, duration/100)
        } else {
            // Hide
            inner_content.style.transform = "scaleY(.01)";
            var collapsed_height = section_header_height + "px";
            outer_section.style.height = collapsed_height;
            setTimeout(() => {
                inner_content.style.display = "none";
            }, duration)
        }

        setTimeout(() => {
            this.toggleInlineHeightAttribute(outer_section);
        }, duration)
    }

    flipKarat (task_section, duration) {
        // Flip karat
        var symbol = task_section.querySelector(".expand-symbol");
        var rotation = symbol.style.rotate;
        symbol.style.transition = `rotate ${duration}ms ease-in-out 0s`;
        if (rotation === "45deg" || rotation === "") {
            symbol.style.rotate = "-135deg";
        } else {
            symbol.style.rotate = "45deg";
        }
    }


    render () {
        return (
            <section id={this.getSectionId()}>
                <div className={(this.state.className !== undefined ? this.state.className + " " : "") + "mid-section"}>
                    <div className="expandable-section-header"  onClick={this.handleSectionToggle}>
                        <div className="expand-symbol"></div>
                        <h2>{this.state.title}</h2>
                    </div>
                    <div className="section-collapsible">
                        { this.state.section_content.map((section) => {
                        return ( 
                            <TaskSectionContent 
                                title={section.optional_title}
                                tasks={section.tasks}
                                empty_text={section.empty_text}
                            />
                        )
                    })}
                    </div>
                </div>
            </section>
        );
    }
}

export default OneTaskSection;