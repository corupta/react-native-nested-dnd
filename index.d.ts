import React, {FunctionComponent} from 'react';
import {StyleProp, ViewStyle} from 'react-native';

interface ItemData {
  isFixed?: boolean;
}

type GroupData = {
  [groupToItemsKey in keyof string]: ItemData[];
} & {
  isFixed?: boolean;
};

interface NestedDNDProps {
  groups: GroupData[];
  updateGroups: (groups: GroupData[]) => void;
  renderItem: (item: ItemData) => React.ReactElement<any>;

  renderGroupHeader: (group: GroupData) => React.ReactElement<any>;
  groupKeyExtractor?: (group: GroupData) => string;
  itemKeyExtractor?: (item: ItemData) => string;
  groupToItemsKey?: string;

  onGroupHeaderPress?: (group: GroupData) => void;
  onItemPress?: (item: ItemData) => void;

  movedWrapStyle?: StyleProp<ViewStyle>;
  ghostStyle?: StyleProp<ViewStyle>;
  renderHeaderView?: any;
  headerViewHeight?: number;
  renderBottomView?: any;
  bottomViewHeight?: number;
}

type NestedDND = FunctionComponent<NestedDNDProps>;

export {NestedDND};
