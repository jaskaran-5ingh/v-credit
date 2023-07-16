import {View, TouchableOpacity, ActivityIndicator, Share} from 'react-native';
import {FlashList} from "@shopify/flash-list";
import {Text, Searchbar} from 'react-native-paper'
import _ from 'lodash';
import navigation from '../../../navigations/index'
import {useCustomersData} from "../../../apis/useApi";
import {useCallback, useEffect, useState} from "react";
import {useAuth} from "../../../hooks";
import {useFocusEffect} from "@react-navigation/native";
import {useFilterToggleStore} from "../../Components/TwoCards";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import {formatDateForMessage} from "../../../core/utils";

const renderItem = ({item, index}) => {

    const toPay = parseFloat((item?.toPay || 0).toFixed(2));
    const toReceive = parseFloat((item?.toReceive || 0).toFixed(2));

    let balance = 0;
    let color = "text-slate-400";
    if (toReceive > toPay) {
        balance = toReceive - toPay;
        color = "text-green-700";
    } else if (toReceive < toPay) {
        balance = toPay - toReceive
        color = "text-red-400";
    }
    let isEven = index % 2 === 0 ?  "bg-slate-50" : "bg-white";
    let formatedDate = formatDateForMessage(item?.last_transaction_date);
    return (<View
        className={`${isEven} flex flex-row justify-between px-4 py-2`}>
        <TouchableOpacity className={"w-[60%]"} onPress={() => navigation.navigate('CustomerTransactionDetails', {
            id: item.customer?.id,
            name: item.customer?.name
        })}>
            <Text variant="titleSmall" class={"text-slate-800"}>{item?.customer?.name}</Text>
            <Text variant={"labelSmall"} className="text-slate-400">{formatedDate}</Text>
        </TouchableOpacity>
        <View className={"flex flex-row justify-center items-center"}>
            <View className={"mr-3"}>
                <Text variant={"bodyMedium"} className={`${color}`}>{Math.abs((balance).toFixed(2))} ₹</Text>
            </View>
            <TouchableOpacity
                className={`${toReceive < toPay && balance !== 0 ? "bg-blue-50" : "bg-slate-100"} p-2 rounded-full flex items-center`}
                onPress={async () => {
                if(toReceive < toPay && balance !== 0) {
                    let messageDate = formatDateForMessage(item?.last_transaction_date);
                    let message = `Hi ${item?.customer?.name},
                    
This is a friendly reminder that you have to pay ${balance} ₹ to me as of ${messageDate}.

Thanks,
${item?.user?.name}
For complete details, Click :
http://mycreditbook.com/udhaar-khata/${item?.customer?.id+"-"+item?.user?.id}
                `;
                    await Share.share({
                        message: message,
                    });
                }
            }}
        >
                <MaterialCommunityIcons name="reminder" size={18} color={`${toReceive < toPay && balance !== 0 ? "dodgerblue" : "gray"}`} />
            </TouchableOpacity>
            <TouchableOpacity
                className={`ml-1 bg-red-50 p-2 rounded-full flex items-center`}
                onPress={() => navigation.navigate("DetailsPdf", {
                    id: item?.customer?.id,
                    name: item?.customer?.name
                })}
            >
                <MaterialIcons name="picture-as-pdf" size={18} color={`tomato`} />
            </TouchableOpacity>
        </View>
    </View>);
};

export default function Index() {
    useFocusEffect(
        useCallback(() => {
            loadCustomerData();
            return () => {
                // Useful for cleanup functions
                // console.log("Screen was unfocused");
            };
        }, [])
    );

    const {mutate, data, isLoading, error} = useCustomersData();
    const [reload, setReload] = useState(false);
    const auth = useAuth?.use?.token();

    const filterBy = useFilterToggleStore(state => state.filterBy);
    const [query, setQuery] = useState("");
    const [filteredList, setFilteredList] = useState([]);
    const [orderedData, setOrderedData] = useState([]);

    useEffect(() => {
        if (data?.data){
            if (filterBy === "none") {
                setOrderedData(data?.data);
            } else {
                setOrderedData(
                    _.filter(data?.data, {
                        'type': filterBy === "toReceive" ? 1 : 0
                    })
                );
            }
        }
    }, [filterBy, data, isLoading]);

    useEffect(() => {
        setFilteredList(orderedData);
    }, [orderedData]);

    function loadCustomerData() {
        setReload(true)
        const formData = new FormData();
        formData.append('cost_center_id', auth?.user.cost_center_id);
        formData.append('company_id', auth?.user.company_id);
        formData.append('user_id', auth?.user.id);
        mutate(formData);
        setReload(false)
    }

    useEffect(() => {
        loadCustomerData();
    }, []);

    const handleSearch = (text) => {
        setQuery(text);
        const filtered = (orderedData).filter((item) =>
            item?.customer?.name?.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredList(filtered);
    };

    const handleOptionSelect = (show) => {
        setShowOptions((show) => !show);
    };

    return (
        <View className={"bg-white flex-1"}>
            <View
                className={
                    "flex flex-row justify-between w-full px-3 items-center py-4"
                }
            >
                <View className={"flex flex-row relative"}>
                    <Searchbar
                        onChangeText={handleSearch}
                        value={query.toString()}
                        style={{
                            width: "100%",
                            backgroundColor : "transparent"
                        }}
                        inputStyle={{
                            fontSize: 12,
                            lineHeight : Platform.OS === "android" ? 16 :  0,
                            paddingBottom: 20
                        }}
                        placeholder="Search Customer Name"
                        className={"bg-white border-2 border-slate-200 h-10"}
                    />
                </View>
            </View>

            {isLoading && !data ? <View className={"flex-1 justify-center"}>
                <ActivityIndicator/>
            </View> : <FlashList
                data={filteredList}
                renderItem={renderItem}
                estimatedItemSize={200}
                refreshing={reload}
                onRefresh={loadCustomerData}
                ListFooterComponent={<View style={{height: 100}}/>}
                ListEmptyComponent={<View className={"flex-1 d-flex justify-center items-center h-16"}><Text
                    variant={"bodyMedium"}>No Records Available!</Text></View>}
            />}
        </View>
    );
}