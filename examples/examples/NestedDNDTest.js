import React, {useState} from 'react';
import {SafeAreaView, StyleSheet, View, Text} from 'react-native';
import NestedDND from 'react-native-nested-dnd/NestedDND';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'pink',
  },
  ghostStyle: {
    opacity: 0.4,
  },
  movingStyle: {
    opacity: 0.9,
    backgroundColor: 'red',
  },
  headerStyle: {
    backgroundColor: '#88dd88',
    width: 400,
    height: 20,
  },
  itemStyle: {
    width: 150,
    height: 150,
    margin: 4,
    backgroundColor: '#eeeecc',
  },
  groupHeaderStyle: {
    width: 400,
    height: 40,
    backgroundColor: '#ccccee',
  },
});

const renderHeader = () => {
  return <View style={styles.headerStyle} />;
};

const headerHeight = 20;

const sampleData = [
  {
    title: 'Group1',
    items: [
      {title: 'Item1'},
      {title: 'Item2'},
      {title: 'Fixed Item3', isFixed: true},
    ],
  },
  {
    title: 'Group2',
    items: [{title: 'Item4'}, {title: 'Fixed Item5', isFixed: true}],
  },
  {
    title: 'Group3',
    items: [{title: 'Item6'}],
  },
  {
    title: 'Group4',
    items: [{title: 'Item7'}, {title: 'Fixed Item8', isFixed: true}],
  },
];

const keyExtractor = props => props.title;
const groupToItemsKey = 'items';

const renderItem = props => {
  return (
    <View style={styles.itemStyle}>
      <Text>{props.title}</Text>
    </View>
  );
};

const renderGroupHeader = props => {
  return (
    <View style={styles.groupHeaderStyle}>
      <Text>{props.title}</Text>
    </View>
  );
};

const NestedDNDTest = () => {
  const [groups, setGroups] = useState(sampleData);

  return (
    <SafeAreaView style={styles.container}>
      <NestedDND
        groups={groups}
        updateGroups={setGroups}
        groupToItemsKey={groupToItemsKey}
        groupKeyExtractor={keyExtractor}
        itemKeyExtractor={keyExtractor}
        renderItem={renderItem}
        renderGroupHeader={renderGroupHeader}
        ghostStyle={styles.ghostStyle}
        movedWrapStyle={styles.movingStyle}
        renderHeaderView={renderHeader()}
        renderBottomView={renderHeader()}
        headerViewHeight={headerHeight}
        bottomViewHeight={headerHeight}
      />
    </SafeAreaView>
  );
};

export default NestedDNDTest;
