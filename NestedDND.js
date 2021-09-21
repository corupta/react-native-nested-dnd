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
      if (item.isGroup) {
        this.layoutMap.clear();
      }
      this.props.onDragStart(item, index);
      setTimeout(() => {
        const realIndex = this.props.dataSource.indexOf(item);
        superStartTouch(item, realIndex);
      }, 10);
    };
    const superMove = this.move;
    this.move = (fromKey, toKey, vy, isDiffline) => {
      const fixedItemKeys = this.props.fixedItemKeys;
      if (fixedItemKeys && fixedItemKeys.includes(toKey)) {
        return;
      }
      superMove(fromKey, toKey, vy, isDiffline);
    };
  }
}

const defaultKeyExtractor = props => props.key;

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

  const [itemDataSource, groupDataSource] = useRefMemo(() => {
    const nextItems = [];
    const nextGroups = [];
    groups.forEach(group => {
      const groupKey = groupKeyExtractor(group);
      const groupItems = group[groupToItemsKey];
      const groupData = {key: `g-${groupKey}`, data: group, isGroup: true};
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
  const [tmpGroupData, setTmpGroupData] = useState(groupDataSource);

  const fixedItemKeys = useRefMemo(() => {
    const res = [];
    (mode === 'group' ? tmpGroupData : tmpItemData).forEach(item => {
      if (item.data.isFixed) {
        res.push(item.key);
      }
    });
    return res;
  }, [mode, tmpItemData]);

  useEffect(() => {
    setTmpItemData(itemDataSource);
  }, [itemDataSource, setTmpItemData]);

  useEffect(() => {
    setTmpGroupData(groupDataSource);
  }, [groupDataSource, setTmpGroupData]);

  const onDragStart = useCallback(
    item => {
      setMovingItem(item);
    },
    [setMovingItem],
  );

  const onDragEnd = useCallback(() => {
    if (mode === 'group') {
      updateGroups(tmpGroupData.map(({data}) => data));
    } else if (mode === 'item') {
      const nextGroups = [];
      tmpItemData.forEach(({data, isGroup}) => {
        if (isGroup) {
          nextGroups.push({...data, [groupToItemsKey]: []});
        } else {
          nextGroups[nextGroups.length - 1][groupToItemsKey].push(data);
        }
      });
      const finalGroups = [];
      groupDataSource.forEach((group, index) => {
        const nextGroup = nextGroups[index];
        let groupItemsChanged =
          group.data[groupToItemsKey].length !==
          nextGroup[groupToItemsKey].length;
        if (!groupItemsChanged) {
          for (
            let itemIndex = 0;
            itemIndex < nextGroup[groupToItemsKey].length;
            ++itemIndex
          ) {
            const prevItem = group.data[groupToItemsKey][itemIndex];
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
          finalGroups.push(group.data);
        }
      });
      updateGroups(finalGroups);
    }
    setMovingItem(null);
  }, [
    mode,
    setMovingItem,
    tmpItemData,
    tmpGroupData,
    groupToItemsKey,
    updateGroups,
  ]);

  const render = useCallback(
    (renderProps, index) => {
      let children;
      if (mode === 'group') {
        children = (
          <View style={styles.groupContainer}>
            {renderGroupHeader(renderProps.data)}
            {renderProps.data[groupToItemsKey].map(item => (
              <View key={itemKeyExtractor(item)}>{renderItem(item)}</View>
            ))}
          </View>
        );
      } else if (renderProps.isGroup) {
        children = renderGroupHeader(renderProps.data);
      } else {
        children = renderItem(renderProps.data);
      }
      return (
        <TouchableOpacity
          onLongPress={() =>
            dragSortableRef.current.startTouch(renderProps, index)
          }
          onPress={() => {
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

  return (
    <CustomAnySizeDragSortableView
      ref={dragSortableRef}
      dataSource={mode === 'group' ? tmpGroupData : tmpItemData}
      keyExtractor={defaultKeyExtractor}
      renderItem={render}
      onDataChange={(nextData, callback) => {
        (mode === 'group' ? setTmpGroupData : setTmpItemData)(nextData);
        setTimeout(callback, 4);
      }}
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
  groupKeyExtractor: PropTypes.func.isRequired,
  itemKeyExtractor: PropTypes.func.isRequired,
  groupToItemsKey: PropTypes.string.isRequired,
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
};

export default NestedDND;
