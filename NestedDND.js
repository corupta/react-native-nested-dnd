import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import PropTypes from 'prop-types';
import {AnySizeDragSortableView} from 'react-native-drag-sort-cr';

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

class NestedDND extends React.PureComponent {
  constructor(props) {
    super(props);
    this.dragSortableRef = React.createRef();
    this.state = {
      movingItem: null,
      mode: null,
    };
    this.calculateData(props);
    this.calculateFixedItemKeys(this.state);
  }
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    const shouldRecalculateData = [
      'groups',
      'groupKeyExtractor',
      'itemKeyExtractor',
      'groupToItemsKey',
    ].reduce((acc, key) => acc || this.props[key] !== nextProps[key], false);
    if (shouldRecalculateData) {
      this.calculateData(nextProps);
    }
  }
  UNSAFE_componentWillUpdate(nextProps, nextState, nextContext) {
    const shouldRecalculateFixedItemKeys = ['mode', 'tmpItemData'].reduce(
      (acc, key) => acc || this.state[key] !== nextState[key],
      false,
    );
    if (shouldRecalculateFixedItemKeys) {
      this.calculateFixedItemKeys(nextState);
    }
  }

  calculateData = props => {
    const {groups, groupKeyExtractor, itemKeyExtractor, groupToItemsKey} =
      props;
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
    this.itemDataSource = nextItems;
    this.groupDataSource = nextGroups;
    this.state.tmpItemData = this.itemDataSource;
    this.state.tmpGroupData = this.groupDataSource;
  };

  calculateFixedItemKeys = state => {
    const {mode, tmpGroupData, tmpItemData} = state;
    const res = [];
    (mode === 'group' ? tmpGroupData : tmpItemData).forEach(item => {
      if (item.data.isFixed) {
        res.push(item.key);
      }
    });
    this.fixedItemKeys = res;
  };

  handleDragStart = item => {
    this.setState({
      movingItem: item,
      mode: item.isGroup ? 'group' : 'item',
    });
  };

  handleDragEnd = () => {
    const {updateGroups, groupToItemsKey, itemKeyExtractor} = this.props;
    const {mode, tmpGroupData, tmpItemData} = this.state;
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
      this.groupDataSource.forEach((group, index) => {
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
    this.setState({
      movingItem: null,
      mode: null,
    });
  };

  handleDataChange = (nextData, callback) => {
    const {mode} = this.state;
    this.setState(
      {
        [mode === 'group' ? 'tmpGroupData' : 'tmpItemData']: nextData,
      },
      callback,
    );
  };

  renderItem = (renderProps, index) => {
    const {
      renderItem,
      renderGroupHeader,
      itemKeyExtractor,
      groupToItemsKey,
      onGroupHeaderPress,
      onItemPress,
    } = this.props;
    const {mode} = this.state;
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
          this.dragSortableRef.current.startTouch(renderProps, index)
        }
        onPress={() => {
          const onPress = renderProps.isGroup
            ? onGroupHeaderPress
            : onItemPress;
          onPress && onPress(renderProps.data);
        }}
        onPressOut={() => this.dragSortableRef.current.onPressOut()}
        {...renderProps.data.touchableProps}>
        {children}
      </TouchableOpacity>
    );
  };

  render() {
    const {
      // expose below props directly
      movedWrapStyle,
      renderHeaderView,
      headerViewHeight,
      renderBottomView,
      bottomViewHeight,
      ghostStyle,
    } = this.props;

    const {mode, tmpGroupData, tmpItemData} = this.state;

    return (
      <CustomAnySizeDragSortableView
        ref={this.dragSortableRef}
        dataSource={mode === 'group' ? tmpGroupData : tmpItemData}
        keyExtractor={defaultKeyExtractor}
        renderItem={this.renderItem}
        onDataChange={this.handleDataChange}
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        fixedItemKeys={this.fixedItemKeys}
        // expose below props directly
        movedWrapStyle={movedWrapStyle}
        ghostStyle={ghostStyle}
        renderHeaderView={renderHeaderView}
        headerViewHeight={headerViewHeight}
        renderBottomView={renderBottomView}
        bottomViewHeight={bottomViewHeight}
      />
    );
  }
}

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
