import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { useEffect, useState, memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import SkeletonPlaceholder from '../../components/skeleton-placeholder ';
import { useCardAmountStore, useFilterToggleStore } from '../../hooks/zustand-store';

const CardLoader = () => (
  <>
    <SkeletonPlaceholder width={40} height={40} borderRadius={100} />
    <View>
      <SkeletonPlaceholder width={100} height={10} />
      <SkeletonPlaceholder width={100} height={10} className="mt-1" />
    </View>
  </>
);

const StyledView = styled(TouchableOpacity);

const Box = ({ className, children, onPress, ...props }) => (
  <StyledView
    onPress={onPress}
    className="flex text-center h-20 rounded-md ₹{className}"
    {...props}>
    {children}
  </StyledView>
);

const DetailCards = ({
  toReceive: propToReceive = 0,
  toPay: propToPay = 0,
  homePage = false,
  isCardLoading,
}) => {
  const toggleFilter = useFilterToggleStore((state) => state.toggleFilter);
  const cardAmount = useCardAmountStore((state) => state.cardAmount);
  const [filterByToReceive, setFilterByToReceive] = useState(false);
  const [filterByToPay, setFilterByToPay] = useState(false);

  const handleToPayClick = () => {
    setFilterByToPay(() => !filterByToPay);
    if (!filterByToPay) {
      toggleFilter('toPay');
    } else {
      toggleFilter('none');
    }
  };

  const handleToReceiveClick = () => {
    setFilterByToReceive(() => !filterByToReceive);
    if (!filterByToReceive) {
      toggleFilter('toReceive');
    } else {
      toggleFilter('none');
    }
  };

  useEffect(() => {
    if (filterByToReceive === true) {
      setFilterByToPay(() => !filterByToReceive);
    }
  }, [filterByToReceive]);

  useEffect(() => {
    if (filterByToPay === true) {
      setFilterByToReceive(() => !filterByToPay);
    }
  }, [filterByToPay]);

  return (
    <StyledView className="h-1/8 flex flex-row items-center space-x-2 bg-blue-50 p-2">
      <Box
        className={` ${
          filterByToReceive ? 'bg-emerald-500' : 'bg-white'
        } flex-1 flex-row items-center justify-evenly shadow-sm shadow-slate-200`}
        onPress={handleToReceiveClick}>
        {isCardLoading ? (
          <CardLoader />
        ) : (
          <>
            <View
              className={` ${
                filterByToReceive ? 'bg-white' : 'bg-emerald-600'
              } h-[40px] w-[40px] items-center justify-center rounded-full p-1`}>
              <MaterialCommunityIcons
                name="call-received"
                size={20}
                color={`${filterByToReceive ? 'green' : 'white'}`}
              />
            </View>
            <View>
              <Text
                variant="bodyMedium"
                className={`${filterByToReceive ? 'text-slate-100' : 'text-slate-500'}`}>
                To Receive
              </Text>

              <Text
                variant="titleSmall"
                className={`${filterByToReceive ? 'text-white' : 'text-slate-700'} font-bold `}>
                {homePage
                  ? Math.abs(parseFloat(cardAmount?.toReceive).toFixed(2))
                  : propToReceive
                    ? Math.abs(parseFloat(propToReceive).toFixed(2))
                    : 0}{' '}
                ₹
              </Text>
            </View>
          </>
        )}
      </Box>
      <Box
        className={`${
          filterByToPay ? 'bg-red-600' : 'bg-white'
        } flex-1 flex-row items-center justify-evenly shadow-sm shadow-slate-200`}
        onPress={handleToPayClick}>
        {isCardLoading ? (
          <CardLoader />
        ) : (
          <>
            <View
              className={`${
                filterByToPay ? 'bg-white' : 'bg-red-500'
              } h-[40px] w-[40px] items-center justify-center rounded-full p-1`}>
              <MaterialIcons
                name="call-made"
                size={20}
                color={`${filterByToPay ? 'red' : 'white'}`}
              />
            </View>
            <View>
              <Text
                variant="bodyMedium"
                className={`${filterByToPay ? 'text-slate-100' : 'text-slate-500'}`}>
                To Pay
              </Text>
              <Text
                variant="titleSmall"
                className={`${filterByToPay ? 'text-white' : 'text-slate-700'} font-bold `}>
                {homePage
                  ? Math.abs(parseFloat(cardAmount?.toPay).toFixed(2))
                  : propToPay
                    ? Math.abs(parseFloat(propToPay).toFixed(2))
                    : 0}{' '}
                ₹
              </Text>
            </View>
          </>
        )}
      </Box>
    </StyledView>
  );
};

export default DetailCards;
