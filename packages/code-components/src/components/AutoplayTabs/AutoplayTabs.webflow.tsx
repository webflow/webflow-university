import AutoplayTabs from "./AutoplayTabs";
import { props } from "@webflow/data-types";
import { declareComponent } from "@webflow/react";

const AutoplayTabsWebflow = declareComponent(AutoplayTabs, {
  name: "Autoplay Tabs",
  description: "Component for Autoplay Tabs",
  group: "Interactive",
  options: {
    applyTagSelectors: true,
  },
  props: {
    autoplay: props.Boolean({
      name: "Autoplay",
      defaultValue: true,
    }),
    autoplayDuration: props.Number({
      name: "Autoplay Interval",
      defaultValue: 5000,
    }),
    tabOneLabel: props.Text({
      name: "Tab One Label",
      defaultValue: "Tab One",
      group: "Tab One",
    }),
    tabOneTitle: props.Text({
      name: "Tab One Title",
      defaultValue: "Tab One Title",
      group: "Tab One",
    }),
    tabOneDescription: props.Text({
      name: "Tab One Description",
      defaultValue: "Tab One Description",
      group: "Tab One",
    }),
    tabOneContent: props.Image({
      name: "Tab One Image",
      group: "Tab One",
    }),
    tabTwoLabel: props.Text({
      name: "Tab Two Label",
      defaultValue: "Tab Two",
      group: "Tab Two",
    }),
    tabTwoTitle: props.Text({
      name: "Tab Two Title",
      defaultValue: "Tab Two Title",
      group: "Tab Two",
    }),
    tabTwoDescription: props.Text({
      name: "Tab Two Description",
      defaultValue: "Tab Two Description",
      group: "Tab Two",
    }),
    tabTwoContent: props.Image({
      name: "Tab Two Image",
      group: "Tab Two",
    }),
    tabThreeLabel: props.Text({
      name: "Tab Three Label",
      defaultValue: "Tab Three",
      group: "Tab Three",
    }),
    tabThreeTitle: props.Text({
      name: "Tab Three Title",
      defaultValue: "Tab Three Title",
      group: "Tab Three",
    }),
    tabThreeDescription: props.Text({
      name: "Tab Three Description",
      defaultValue: "Tab Three Description",
      group: "Tab Three",
    }),
    tabThreeContent: props.Image({
      name: "Tab Three Content",
      group: "Tab Three",
    }),
  },
});

export default AutoplayTabsWebflow;
