import { GenericWidgetSettings } from "../generic-widgets/settings"

export type CalendarWidgetSettings = {
    weekDisplay: {
        alignWeekdayBottoms: boolean,
        tasksSpanBetweenDays: boolean,
    }
} & GenericWidgetSettings;