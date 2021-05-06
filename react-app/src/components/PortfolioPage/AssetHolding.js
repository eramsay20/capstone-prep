import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { loadTrades } from '../../store/trade'

const AssetHolding = ({ symbol, shares, purchasePrice, equityObj, currencyFormatter }) => {
    
    //raw data
    let current_price =300; // replace with API call
    let total_cost =shares * purchasePrice;
    let equity_value =shares * current_price

    // formatted 
    let fPrice = currencyFormatter(300); // replace with API call
    let fPurchasePrice = currencyFormatter(purchasePrice)
    let fEquityValue = currencyFormatter(shares * current_price)
    let fTotalReturn = currencyFormatter(equity_value - total_cost)
    
    equityObj[`${symbol}`] = equity_value
   
    return (
            <tr className='holding-row'>
                <td className="">{symbol}</td>
                <td className="">{shares}</td>
                <td className="">{fPrice}</td>
                <td className="">{fPurchasePrice}</td>
                <td className="">{fTotalReturn}</td>
                <td className="">{fEquityValue}</td>
            </tr>
    )
}

export default AssetHolding;