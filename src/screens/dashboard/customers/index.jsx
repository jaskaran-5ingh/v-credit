import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';

import { useCustomersData } from '../../../apis/use-api';
import Avatar from '../../../components/avatar';
import { formatDateForMessage } from '../../../core/utils';
import { useAuth } from '../../../hooks';
import { useAuthCompanyStore, useFilterToggleStore } from '../../../hooks/zustand-store';
import navigation from '../../../navigations/index';

const renderBackdropComponent = (props) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.4}
    pressBehavior="close"
  />
);

const sendReminder = async (item) => {
  if (item?.customer.toReceive < item?.customer.toPay && item?.customer.balance !== 0) {
    const messageDate = formatDateForMessage(item?.last_transaction_date);
    const message = `Hi ${item?.customer?.name},
                      
  This is a friendly reminder that you have to pay ${
    item?.customer.balance
  } ₹ to me as of ${messageDate}.
  
  Thanks,
  ${item?.user?.name}
  For complete details, Click :
  http://mycreditbook.com/udhaar-khata/${item?.customer?.id + '-' + item?.user?.id}
                  `;
    await Share.share({
      message,
    });
  }
};

export default function Index() {
  // ref
  const bottomSheetModalRef = useRef(null);
  const sharePDF = async (item) => {
    bottomSheetModalRef.current?.dismiss();

    setTimeout(() => {
      navigation.navigate('DetailsPdf', {
        id: item?.customer?.id,
        name: item?.customer?.name,
      });
    }, 1000);
  };

  // variables
  const snapPoints = useMemo(() => ['45%'], []);

  const [selectedItem, setSelectedItem] = useState(null);

  // callbacks
  const handlePresentModalPress = useCallback((item) => {
    bottomSheetModalRef.current?.present();
    setSelectedItem(item);
  }, []);

  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  const renderItem = ({ item, index }) => {
    const toPay = parseFloat((item?.toPay || 0).toFixed(2));
    const toReceive = parseFloat((item?.toReceive || 0).toFixed(2));

    let balance = 0;
    let color = 'text-slate-400';
    if (toReceive > toPay) {
      balance = toReceive - toPay;
      color = 'text-green-700';
    } else if (toReceive < toPay) {
      balance = toPay - toReceive;
      color = 'text-red-400';
    }

    const formatedDate = formatDateForMessage(item?.last_transaction_date);
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('CustomerTransactionDetails', {
            id: item.customer?.id,
            name: item.customer?.name,
            toPay: item?.toPay,
            toReceive: item?.toReceive,
            balance: item?.balance,
            balanceType: item?.type === 1 ? 'Advance ' : item?.type === 2 ? 'Clear ' : 'Balance',
          })
        }
        delayLongPress={200}
        onLongPress={() => {
          handlePresentModalPress(item);
        }}
        className={`flex flex-row items-center justify-between border-b border-slate-100 px-2 py-4 `}>
        <View className="flex flex-row items-center px-1">
          <Avatar name={item?.customer?.name} size={40} />
          <View className="ml-2.5">
            <Text class="font-bold text-slate-800">{item?.customer?.name}</Text>
            <Text variant="labelSmall" className="text-slate-500">
              {formatedDate}
            </Text>
          </View>
        </View>
        <View className="mr-2 flex flex-row items-center justify-center">
          <View className="mr-2">
            <Text variant="bodySmall" className={`${color}`}>
              {Math.abs(balance.toFixed(2))} ₹
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const { mutate: customerDataRequest, data: customerData, isLoading } = useCustomersData();
  const [reload, setReload] = useState(false);
  const auth = useAuth?.use?.token();
  const company = useAuthCompanyStore((state) => state.selectedCompany);

  const filterBy = useFilterToggleStore((state) => state.filterBy);
  const [query, setQuery] = useState('');
  const [filteredList, setFilteredList] = useState([]);
  const [orderedData, setOrderedData] = useState([]);

  useEffect(() => {
    if (customerData?.data) {
      if (filterBy === 'none') {
        setOrderedData(customerData?.data);
      } else {
        setOrderedData(
          _.filter(customerData?.data, {
            type: filterBy === 'toReceive' ? 1 : 0,
          })
        );
      }
    }
  }, [filterBy, customerData, isLoading]);

  useEffect(() => {
    setFilteredList(orderedData);
  }, [orderedData]);

  function getCustomerData() {
    if (company) {
      setReload(true);
      const formData = new FormData();
      formData.append('cost_center_id', auth?.user.cost_center_id);
      formData.append('company_id', company?.id);
      formData.append('user_id', auth?.user.id);
      customerDataRequest(formData);
      setReload(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getCustomerData();
    }, [company])
  );

  const handleSearch = (text) => {
    setQuery(text);
    const filtered = orderedData.filter((item) =>
      item?.customer?.name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredList(filtered);
  };

  return (
    <View className="flex-1 bg-white">
      <View
        className={`flex w-full flex-row items-center justify-between px-3  ${
          Platform.OS === 'android' ? 'py-2' : 'pb-2'
        }`}>
        <View className="relative flex flex-row">
          <Searchbar
            onChangeText={handleSearch}
            value={query.toString()}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
            }}
            inputStyle={{
              fontSize: 12,
              lineHeight: Platform.OS === 'android' ? 16 : 0,
              paddingBottom: 20,
            }}
            placeholder="Search Customer Name"
            className="h-10 border-2 border-slate-200 bg-white"
          />
        </View>
      </View>

      <FlashList
        data={filteredList || []}
        renderItem={renderItem}
        estimatedItemSize={200}
        refreshing={reload}
        onRefresh={getCustomerData}
        ListFooterComponent={<View style={{ height: 100 }} />}
        ListEmptyComponent={
          <View className="d-flex h-16 flex-1 items-center justify-center">
            <Text variant="bodyMedium">No Records Available!</Text>
          </View>
        }
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdropComponent}
        handleIndicatorStyle={{
          backgroundColor: 'lightgray',
        }}>
        <View style={styles.contentContainer}>
          <View>
            <View className="flex flex-row items-center">
              <Avatar name={selectedItem?.customer?.name} size={40} />
              <View className="ml-3">
                <Text variant="titleMedium">{selectedItem?.customer?.name}</Text>
                <Text>{formatDateForMessage(selectedItem?.last_transaction_date)}</Text>
              </View>
            </View>
            <View className="mt-3 border-b border-slate-200" />
            <View className="mt-2">
              <View className="mt-3 flex flex-row justify-between">
                <Text variant="titleSmall" className="text-slate-700 ">
                  Paid
                </Text>
                <Text variant="titleSmall" className="text-slate-700">
                  {' '}
                  {selectedItem?.toPay} <FontAwesome name="rupee" size={14} color="black" />
                </Text>
              </View>

              <View className="mt-3 flex flex-row justify-between">
                <Text variant="titleSmall" className="text-slate-700 ">
                  Received
                </Text>
                <Text variant="titleSmall" className="text-slate-700">
                  {selectedItem?.toReceive} <FontAwesome name="rupee" size={14} color="black" />
                </Text>
              </View>

              <View className="mt-3 flex flex-row justify-between">
                <Text variant="titleSmall" className="text-slate-700 ">
                  {selectedItem?.type === 1
                    ? 'Advance '
                    : selectedItem?.type === 2
                      ? 'Clear '
                      : 'Balance'}
                </Text>
                <Text
                  variant="titleMedium"
                  className={
                    selectedItem?.type === 1
                      ? 'text-green-600'
                      : selectedItem?.type === 2
                        ? 'text-slate-500'
                        : 'text-red-500'
                  }>
                  {selectedItem?.balance}{' '}
                  <FontAwesome
                    name="rupee"
                    size={14}
                    color={
                      selectedItem?.type === 1 ? 'green' : selectedItem?.type === 2 ? 'gray' : 'red'
                    }
                  />
                </Text>
              </View>
            </View>
          </View>
          <View className="flex flex-row items-center justify-center gap-16">
            <View>
              <TouchableOpacity
                className="flex items-center"
                onPress={() => {
                  bottomSheetModalRef.current?.close();
                  sendReminder(selectedItem);
                }}>
                <Ionicons name="alarm-outline" size={28} color="black" />
              </TouchableOpacity>
              <Text variant="bodyMedium" className="mt-2 text-slate-900">
                Reminder
              </Text>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  bottomSheetModalRef.current?.close();
                  sharePDF(selectedItem);
                }}
                className="flex items-center">
                <AntDesign name="pdffile1" size={26} color="black" />
              </TouchableOpacity>
              <Text variant="bodyMedium" className="mt-2 text-slate-900">
                Share PDF
              </Text>
            </View>
          </View>
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 0.88,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});