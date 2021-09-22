# react-native-nested-dnd
Nested group drag and drop for react native

![GitHub license](https://img.shields.io/badge/license-MIT-green.svg)
[![npm](https://img.shields.io/npm/v/react-native-nested-dnd.svg?style=flat)](https://npmjs.com/package/react-native-nested-dnd)

### Summary
I've implemented a hacky wrapper to use 
[react-native-drag-sort](https://github.com/mochixuan/react-native-drag-sort) 
by [@mochixuan](https://github.com/mochixuan) with nested groups.

Overall, this package allows drag&dropping items of groups across and within groups. 
Also, it allows reordering groups by dragging them.

Additionally, because of the DND core, it supports auto-scrolling when an item/group is dragged near the edge of the screen.

Special thanks to [@mochixuan](https://github.com/mochixuan) for building such a nice and performant DND core.

#### Implementation Details

The original package can work with custom sized items.
My way around is to convert groups and nested items into a flattened list.
Then, each item can be dragged & drop within and across different groups.
However, when a group is dragged, I quickly hide the items and put them inside the group view,
so that all items within the group will also be dragged. Finally, I revert this process when the drag ends.
Thus, we can achieve nested drag&drop.

### Installation

```bash
yarn add react-native-nested-dnd
or
npm i react-native-nested-dnd --save 

export { NestedDND }
```

### Tip
Please do not try to implement keys via indexes, use something like `uuid`. 
Keys being unique is critical for the package to work.



### Examples（with GIF）
* Please, check out the examples for how to use.

| [NestedDNDTest](https://github.com/corupta/react-native-nested-dnd/blob/master/examples/examples/NestedDNDTest.js) |
| ------ |
| ![NestedDNDTest](img/NestedDNDTest.gif?raw=true) |


### API

#### NestedDND

isRequired if there is a * in the name field

|Name|Proptypes|Default|Description|  
----|----|-----|---|
|**groups** *|array||main data
|**updateGroups** *|func||This method is called when the groups data changes after a finished drag.
|**renderItem** *|func||render item view
|**renderGroupHeader** *|func||render group header view
|**groupKeyExtractor**|func|`(g) => g.key`|(group) => key
|**itemKeyExtractor**|func|`(i) => i.key`|(item) => key
|**groupToItemsKey**|string|`"items"`|which property of each group contains an array of items (eg: group.items)
|**onGroupHeaderPress**|func||(group) => void
|**onItemPress**|func||(item) => void
|**movedWrapStyle**| StyleProp<ViewStyle> |`backgroundColor: 'blue, zIndex:999`|style
|**ghostStyle**| StyleProp<ViewStyle> |`{opacity:0.5}`|style
|**renderHeaderView**|element||
|**headerViewHeight**|number||
|**renderBottomView**|element||
|**bottomViewHeight**|number||


### Known Issues

* If a group is empty, cannot drag and drop an item inside it, for some reason.
* When a group is dragged, due to the nature of my hacky implementation it blinks at first. Unfortunately, this won't be fixed. To fix it one might need to come up with a ground-up implementation that supports nested drag/drop. (Need to re-write current DND core) 
