import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, memo } from 'react';
import { Controller } from 'react-hook-form';
import { Text, TextInput } from 'react-native-paper';

import { COLORS } from '../../../core';

const UsernameInput = ({ control, errors }) => {
  const usernameRules = useMemo(
    () => ({
      required: 'Name is required',
      minLength: {
        value: 3,
        message: 'Name must be at least 3 characters long',
      },
      maxLength: {
        value: 20,
        message: 'Name must not exceed 20 characters',
      },
    }),
    []
  );
  return (
    <Controller
      control={control}
      rules={usernameRules}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <TextInput
            onBlur={onBlur}
            onChangeText={(text) => onChange(text)}
            value={value}
            label="Full Name"
            className="bg-white"
            mode="outlined"
            placeholder="Enter Username"
            placeholderTextColor={COLORS.darkGray}
            activeOutlineColor="darkgreen"
            left={
              <TextInput.Icon icon={() => <MaterialCommunityIcons name="account" size={20} />} />
            }
          />
          {errors?.username && (
            <Text variant="bodySmall" className="mt-1 font-bold text-amber-700">
              *{errors?.username?.message}
            </Text>
          )}
        </>
      )}
      name="username"
      defaultValue=""
    />
  );
};

export default memo(UsernameInput);
