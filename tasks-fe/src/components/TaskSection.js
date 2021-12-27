import React from "react";

import TaskSectionContent from "./TaskSectionContent";

class OneTaskSection extends React.Component {
    constructor(props) {
        super(props);
        // Format section_content as a list of dictionary elements with keys:
        // {
        //     optional_title= "",
        //     tasks= [],
        //     empty_text= ""
        // }
        this.state = {
            title: this.props.title,
            section_content: this.props.section_content
        };  
    }

    render () {
        return (
            <section>
                <div className="{this.state.className} mid-section">
                    <div className="expandable-section-header">
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