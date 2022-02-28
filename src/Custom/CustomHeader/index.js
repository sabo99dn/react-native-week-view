import { View, Text } from 'react-native'
import React from 'react'
import { calculateColumnsDataArray } from '../../utils'

const CustomHeader = ({index, data, numOfDays, HorizontalCustom}) => {
  const dataList = calculateColumnsDataArray(data, numOfDays, index)
  if(HorizontalCustom){
    return (
      <View style={{flex: 1,flexDirection: 'row',}}>
        {
        dataList.map((item, index)=>{
          return(
            <HorizontalCustom item={item}/>
          )
        })
        }
      </View>
    )
  }else{
    return (
      <View style={{flex: 1,flexDirection: 'row',}}>
        {
        dataList.map((item, index)=>{
          return(
            <Text style={{flex: 1}}>{item?.EmployeeID}</Text>
          )
        })
        }
      </View>
    )
  }
}

export default CustomHeader