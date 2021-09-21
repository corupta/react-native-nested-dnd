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



### Performance（GIF）
TODO WIP

### API

#### NestedDND
TODO WIP
