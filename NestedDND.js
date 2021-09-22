import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import PropTypes from 'prop-types';
import {AnySizeDragSortableView} from 'react-native-drag-sort-cr';
import useRefMemo from './utils/useRefMemo';

const styles = StyleSheet.create({
  groupContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

class CustomAnySizeDragSortableView extends AnySizeDragSortableView {
  constructor(props) {
    super(props);
    const superStartTouch = this.startTouch;
    this.startTouch = (item, index) => {
      const fixedItemKeys = this.props.fixedItemKeys;
      const key = this.props.keyExtractor(item);
      if (fixedItemKeys && fixedItemKeys.includes(key)) {
        return;
      }
      superStartTouch(item, index);
      this.props.onDragStart(item, index);
    };
    const superMove = this.move;
    this.move = (fromKey, toKey, vy, isDiffline) => {
      const fixedItemKeys = this.props.fixedItemKeys;
      const fromIndex = this.keyToIndexMap.get(fromKey);
      const fromItem = this.props.dataSource[fromIndex];
      let finalToKey = toKey;
      if (fromItem.isGroup) {
        let toIndex = this.keyToIndexMap.get(toKey);
        if (toIndex < fromIndex) {
          while (
            this.props.dataSource[toIndex] &&
            !this.props.dataSource[toIndex].isGroup
          ) {
            --toIndex;
          }
          // if (toIndex < 0) return;
          finalToKey = this.props.keyExtractor(this.props.dataSource[toIndex]);
          if (fixedItemKeys && fixedItemKeys.includes(finalToKey)) {
            return;
          }
        } else {
          ++toIndex;
          while (
            this.props.dataSource[toIndex] &&
            !this.props.dataSource[toIndex].isGroup
          ) {
            ++toIndex;
          }
          --toIndex;
          finalToKey = this.props.keyExtractor(this.props.dataSource[toIndex]);
          while (
            this.props.dataSource[toIndex] &&
            !this.props.dataSource[toIndex].isGroup
          ) {
            --toIndex;
          }
          const toGroupKey = this.props.keyExtractor(
            this.props.dataSource[toIndex],
          );
          if (fixedItemKeys && fixedItemKeys.includes(toGroupKey)) {
            return;
          }
        }
      } else if (fixedItemKeys && fixedItemKeys.includes(toKey)) {
        return;
      }
      superMove(fromKey, finalToKey, vy, isDiffline);
    };
  }
}

const defaultKeyExtractor = props => props.key;
const countExtractor = props => props.count || 1;

const NestedDND = props => {
  const {
    groups,
    updateGroups,
    renderItem,
    renderGroupHeader,
    groupKeyExtractor,
    itemKeyExtractor,
    groupToItemsKey,
    onGroupHeaderPress,
    onItemPress,
    // expose below props directly
    movedWrapStyle,
    renderHeaderView,
    headerViewHeight,
    renderBottomView,
    bottomViewHeight,
    ghostStyle,
  } = props;

  const dragSortableRef = useRef();

  const [itemDataSource] = useRefMemo(() => {
    const nextItems = [];
    const nextGroups = [];
    groups.forEach(group => {
      const groupKey = groupKeyExtractor(group);
      const groupItems = group[groupToItemsKey];
      const groupData = {
        key: `g-${groupKey}`,
        data: group,
        isGroup: true,
        count: groupItems.length + 1,
      };
      nextItems.push(groupData);
      nextGroups.push(groupData);
      groupItems.forEach(groupItem => {
        const itemKey = itemKeyExtractor(groupItem);
        nextItems.push({key: `i-${itemKey}`, data: groupItem});
      });
    });
    return [nextItems, nextGroups];
  }, [groups, groupKeyExtractor, itemKeyExtractor, groupToItemsKey]);

  const [movingItem, setMovingItem] = useState(null);

  const mode = movingItem ? (movingItem.isGroup ? 'group' : 'item') : null;

  const [tmpItemData, setTmpItemData] = useState(itemDataSource);

  const fixedItemKeys = useRefMemo(() => {
    const res = [];
    tmpItemData.forEach(item => {
      if (item.data.isFixed) {
        res.push(item.key);
      }
    });
    return res;
  }, [mode, tmpItemData]);

  useEffect(() => {
    setTmpItemData(itemDataSource);
  }, [itemDataSource, setTmpItemData]);

  const onDragStart = useCallback(
    item => {
      setMovingItem(item);
    },
    [setMovingItem],
  );

  const onDragEnd = useCallback(() => {
    const nextGroups = [];
    tmpItemData.forEach(({data, isGroup}) => {
      if (isGroup) {
        nextGroups.push({...data, [groupToItemsKey]: []});
      } else {
        nextGroups[nextGroups.length - 1][groupToItemsKey].push(data);
      }
    });
    if (mode === 'group') {
      updateGroups(nextGroups);
    } else if (mode === 'item') {
      const finalGroups = [];
      groups.forEach((group, index) => {
        const nextGroup = nextGroups[index];
        let groupItemsChanged =
          group[groupToItemsKey].length !== nextGroup[groupToItemsKey].length;
        if (!groupItemsChanged) {
          for (
            let itemIndex = 0;
            itemIndex < nextGroup[groupToItemsKey].length;
            ++itemIndex
          ) {
            const prevItem = group[groupToItemsKey][itemIndex];
            const nextItem = nextGroup[groupToItemsKey][itemIndex];
            if (itemKeyExtractor(prevItem) !== itemKeyExtractor(nextItem)) {
              groupItemsChanged = true;
              break;
            }
          }
        }
        if (groupItemsChanged) {
          finalGroups.push(nextGroup);
        } else {
          finalGroups.push(group);
        }
      });
      updateGroups(finalGroups);
    }
    setMovingItem(null);
  }, [mode, setMovingItem, tmpItemData, groups, groupToItemsKey, updateGroups]);

  const render = useCallback(
    (renderProps, index) => {
      let children;
      if (renderProps.isGroup) {
        children = renderGroupHeader(renderProps.data);
      } else {
        children = renderItem(renderProps.data);
      }
      return (
        <TouchableOpacity
          onLongPress={() => {
            dragSortableRef.current.startTouch(renderProps, index);
          }}
          onPress={() => {
            console.log('woo');
            const onPress = renderProps.isGroup
              ? onGroupHeaderPress
              : onItemPress;
            onPress && onPress(renderProps.data);
          }}
          onPressOut={() => dragSortableRef.current.onPressOut()}
          {...renderProps.data.touchableProps}>
          {children}
        </TouchableOpacity>
      );
    },
    [
      mode,
      movingItem,
      renderGroupHeader,
      renderItem,
      groupToItemsKey,
      itemKeyExtractor,
      onGroupHeaderPress,
      onItemPress,
    ],
  );

  const onDataChange = useCallback(
    (nextData, callback) => {
      // console.log('nextdata', nextData);
      setTmpItemData(nextData);
      setTimeout(callback, 4);
    },
    [setTmpItemData],
  );

  return (
    <CustomAnySizeDragSortableView
      ref={dragSortableRef}
      dataSource={tmpItemData}
      keyExtractor={defaultKeyExtractor}
      countExtractor={countExtractor}
      renderItem={render}
      onDataChange={onDataChange}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      fixedItemKeys={fixedItemKeys}
      // expose below props directly
      movedWrapStyle={movedWrapStyle}
      ghostStyle={ghostStyle}
      renderHeaderView={renderHeaderView}
      headerViewHeight={headerViewHeight}
      renderBottomView={renderBottomView}
      bottomViewHeight={bottomViewHeight}
    />
  );
};

NestedDND.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateGroups: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  renderGroupHeader: PropTypes.func.isRequired,
  groupKeyExtractor: PropTypes.func,
  itemKeyExtractor: PropTypes.func,
  groupToItemsKey: PropTypes.string,
  onGroupHeaderPress: PropTypes.func,
  onItemPress: PropTypes.func,
  // expose below props directly
  movedWrapStyle: AnySizeDragSortableView.propTypes.movedWrapStyle,
  renderHeaderView: AnySizeDragSortableView.propTypes.renderHeaderView,
  headerViewHeight: AnySizeDragSortableView.propTypes.headerViewHeight,
  renderBottomView: AnySizeDragSortableView.propTypes.renderBottomView,
  bottomViewHeight: AnySizeDragSortableView.propTypes.bottomViewHeight,
  ghostStyle: AnySizeDragSortableView.propTypes.ghostStyle,
};

NestedDND.defaultProps = {
  groupKeyExtractor: defaultKeyExtractor,
  itemKeyExtractor: defaultKeyExtractor,
  groupToItemsKey: 'items',
};

export default NestedDND;
