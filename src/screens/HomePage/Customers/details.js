import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useState } from 'react';
import { Linking, Platform, Share, TouchableOpacity, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';

import _ from 'lodash';
import { useCustomerTransactionData } from '../../../apis/useApi';
import { formatDateForMessage, renderHeader } from '../../../core/utils';
import { useAuth } from '../../../hooks';
import FloatingButtons from '../../Components/FloatingButton';
import { log } from 'react-native-reanimated';

function processString(input = null) {
  if (input == null || input === '' || input === 'null') {
    return '';
  }
  // Remove "-", ",", and spaces from the string
  let processedString = input.replace(/[-,\s]/g, '');

  // If the resulting string has a length greater than 10, remove the first three letters
  if (processedString.length > 10) {
    processedString = processedString.substring(3);
  }

  return processedString;
}

const makePhoneCall = (phoneNumber) => {
  const url = `tel:${processString(phoneNumber)}`;
  Linking.canOpenURL(url)
    .then(() => {
      return Linking.openURL(url);
    })
    .catch((error) => console.error(error));
};

const sendWhatsApp = async ({
  created_at,
  to_pay_balance,
  to_receive_balance,
  name,
  balance,
  id,
}) => {
  let messageDate = formatDateForMessage(created_at);
  let message = `Hi ${name}`;

  if (to_receive_balance < to_pay_balance && balance !== 0) {
    message = `Hi ${name},
          
This is a friendly reminder that you have to pay ${Math.abs(balance).toFixed(2)} ₹ to me as of ${messageDate}.

Thanks,
MyCreditBook
For complete details,
Click : http://mycreditbook.com/udhaar-khata/${id}
      `;
  } else {
    message = `Hi ${name},
          
I will pay ${Math.abs(balance).toFixed(2)}₹ to you.

Thanks,
MyCreditBook
For complete details,
Click : http://mycreditbook.com/udhaar-khata/${id}`;
  }
  await Share.share({
    message: message,
  });
};

const renderItem = ({ item, index, user, customer, balance }) => {
  let message;
  let dateFormatted = formatDateForMessage(item?.date);
  if (item?.transaction_type_id === 2) {
    message = `Hi ${customer?.name},
    
I received payment of ${parseFloat(item?.amount).toFixed(2)} ₹ on ${dateFormatted} from you.
Total Balance: ${Math.abs(balance).toFixed(2)}₹.

Thanks,
${user?.name}
For complete details,
Click : http://mycreditbook.com/udhaar-khata/${customer?.id}-${user?.id}`;
  } else {
    message = `Hi ${customer?.name},
I gave you credit of ${parseFloat(item?.amount).toFixed(2)} ₹ on ${dateFormatted}.
Total Balance: ${Math.abs(balance).toFixed(2)} ₹.

Thanks,
${user?.name}
For complete details,
Click : http://mycreditbook.com/udhaar-khata/${customer?.id}-${user?.id}`;
  }

  return (
    <TouchableOpacity
      className={
        'flex flex-row justify-between items-center px-1.5 py-2 border-b-2 border-slate-200'
      }
      onPress={async () => {
        await Share.share({
          message: message,
        });
      }}
    >
      <View className='flex flex-row items-center w-1/4'>
        <View className='mr-1'>
          {item?.transaction_type_id === 2 ? (
            <MaterialCommunityIcons
              name='call-received'
              size={14}
              color='green'
            />
          ) : (
            <MaterialIcons name='call-made' size={14} color='red' />
          )}
        </View>
        <View>
          <Text variant={'titleSmall'} className='text-slate-800'>
            {item?.transaction_type_id === 2 ? 'Payment' : 'Credit'}
          </Text>
          <Text variant={'labelSmall'} className='text-slate-400'>
            {dateFormatted}
          </Text>
        </View>
      </View>
      <View>
        {item?.transaction_type_id === 1 ? (
          <View className={'mr-2'}>
            <Text variant={'bodyMedium'} className='text-slate-800 mr-2'>
              {parseFloat(item?.amount).toFixed(2)}₹
            </Text>
            <Text variant={'labelSmall'} className='text-slate-400 mr-2'>
              (Udhaar)
            </Text>
          </View>
        ) : (
          <Text variant={'bodyMedium'} className={'text-slate-400 text-center'}>
            {' '}
            -{' '}
          </Text>
        )}
      </View>
      <View className={'flex flex-row items-right'}>
        <View>
          {item?.transaction_type_id === 2 ? (
            <View>
              <Text variant={'bodyMedium'} className='text-slate-800'>
                {parseFloat(item?.amount).toFixed(2)}₹
              </Text>
              <Text variant={'labelSmall'} className='text-slate-400'>
                (Payment)
              </Text>
            </View>
          ) : (
            <Text
              variant={'bodyMedium'}
              className={'text-slate-400 text-center'}
            >
              {' '}
              -{' '}
            </Text>
          )}
        </View>
        <View className='mx-2 bg-blue-50 h-8 w-8 rounded-full flex justify-center items-center'>
          <MaterialIcons name='share' size={18} color={`dodgerblue`} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Index({ navigation, route }) {
  const auth = useAuth.use?.token();
  const { mutate, data, isLoading } = useCustomerTransactionData();
  const [orderedData, setOrderedData] = useState([]);
  const [filterBy, setFilteredBy] = useState('Clear');

  useEffect(() => {
    if (data?.data) {
      if (filterBy === 'Clear') {
        setOrderedData(data?.data?.transactions);
      } else {
        const orderedArray = _.orderBy(
          data?.data?.transactions,
          ['transaction_type_id'],
          [filterBy === 'Payment Received' ? 'desc' : 'asc'],
        );
        setOrderedData(orderedArray);
      }
    }
  }, [filterBy, data, isLoading]);

  useEffect(() => {
    setFilteredList(orderedData);
  }, [orderedData]);

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    setFilteredList(orderedData);
  }, [orderedData]);

  const options = [
    { label: 'Credit Given', onPress: () => setFilteredBy('Credit Given') },
    {
      label: 'Payment Received',
      onPress: () => setFilteredBy('Payment Received'),
    },
    {
      label: 'Clear',
      onPress: () => {
        setFilteredBy('Clear');
        setShowOptions(false);
      },
    },
  ];

  const [filteredList, setFilteredList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [query, setQuery] = useState('');
  const [reload, setReload] = useState(false);

  const handleSearch = (inputValue) => {
    setQuery(inputValue);
    // setFilteredList(filteredList);
  };

  function loadCustomerData() {
    setReload(true);
    const formData = new FormData();
    formData.append('company_id', auth.user.company_id);
    formData.append('cost_center_id', auth.user.cost_center_id);
    formData.append('customer_id', route.params.id);
    // formData.append("user_id", auth.user.id);
    mutate(formData);
    setReload(false);
  }
  const handleOptionSelect = () => {
    setShowOptions((show) => !show);
  };

  const toPay = parseFloat((data?.data?.toPay || 0).toFixed(2));
  const toReceive = parseFloat((data?.data?.toReceive || 0).toFixed(2));

  let balance = 0;
  let BgColor = 'bg-slate-400';
  if (toReceive > toPay) {
    balance = toReceive - toPay;
    BgColor = 'bg-green-700';
  } else if (toReceive < toPay) {
    balance = toPay - toReceive;
    BgColor = 'bg-red-400';
  }

  return (
    <View className={'bg-white flex-1'}>
      <View className='bg-blue-50 h-28'>
        <View className='mx-2 h-24 bg-white mt-1 rounded-md shadow-sm flex flex-row items-center justify-between px-4'>
          <View className='flex flex-row space-x-4 items-center'>
            <View className='h-8 w-8 rounded-full overflow-hidden'>
              <Text
                className={`${BgColor} p-2 text-white text-center flex-1 justify-center items-center rounded-full size-12`}
              >
                ₹
              </Text>
            </View>
            <View className='ml-2'>
              <Text variant='bodyMedium' className='text-slate-600 '>
                {toReceive > toPay ? 'To Receive' : 'To Pay'}
              </Text>
              <Text variant='bodyLarge' className='text-slate-900 font-bold'>
                {Math.abs(balance)}₹
              </Text>
            </View>
          </View>

          <View className='flex flex-row space-x-4 pr-2 pl-8'>
            <TouchableOpacity
              className='bg-red-50 p-2 rounded-full  flex items-center'
              onPress={() =>
                navigation.navigate('DetailsPdf', {
                  id: data?.data?.customer?.id,
                  name: data?.data?.customer?.name,
                })
              }
            >
              <MaterialIcons name='picture-as-pdf' size={24} color='tomato' />
            </TouchableOpacity>
            <TouchableOpacity
              className='bg-blue-50 p-2 rounded-full  flex items-center'
              onPress={() => makePhoneCall(data?.data?.customer?.phone)}
            >
              <MaterialIcons name='call' size={24} color='dodgerblue' />
            </TouchableOpacity>
            <TouchableOpacity
              className='bg-blue-50 p-2 rounded-full'
              onPress={() => sendWhatsApp(data?.data?.customer)}
            >
              <MaterialCommunityIcons name='whatsapp' size={26} color='green' />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View
        className={
          'flex flex-row justify-between w-full px-3 items-center py-4'
        }
      >
        <View className={'flex flex-row relative'} style={{ width: '80%' }}>
          <Searchbar
            onChangeText={(text) => handleSearch(text)}
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
            placeholder='Search Amount or Txn Note'
            className={'bg-white border-2 border-slate-200 h-10'}
          />
        </View>
        <View className={'flex'} style={{ width: '15%' }}>
          {options && (
            <TouchableOpacity
              className='p-2 bg-white border-slate-900 shadow shadow-slate-300 rounded-xl w-[48] mt-1 h-[40] justify-center items-center'
              onPress={() => handleOptionSelect(true)}
            >
              <Feather name='filter' size={20} color='black' />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {showOptions && (
        <View
          style={{
            flex: 1,
            position: 'absolute',
            zIndex: 9999999,
            backgroundColor: 'white',
          }}
          className={
            'border-2 border-slate-100 shadow-black shadow-lg right-10 top-14'
          }
        >
          {options.map((value, index) => {
            return (
              <TouchableOpacity
                key={index}
                onPress={value.onPress}
                className={
                  value.label === filterBy ? 'bg-slate-200' : 'bg-white'
                }
              >
                <Text variant={'labelLarge'} className={'pl-2 pr-4 py-2'}>
                  {value.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {filteredList && (
        <FlashList
          data={filteredList}
          renderItem={({ item, index }) =>
            renderItem({
              item,
              index,
              user: auth.user,
              balance,
              customer: data?.data?.customer,
            })
          }
          ListHeaderComponent={renderHeader}
          estimatedItemSize={200}
          selected={selectedItem}
          showOptions={showOptions}
          options={options}
          refreshing={reload}
          onRefresh={loadCustomerData}
          onOptionSelect={handleOptionSelect}
        />
      )}
      <FloatingButtons
        navigation={navigation}
        customer={data?.data?.customer}
      />
    </View>
  );
}
