require('dotenv').config()
const formidable = require('formidable')
const express = require('express')
const router = express.Router()
const {v4:uuidv4} = require('uuid')
const PaymentChecksum = require('./PaytmChecksum')


router.post('/callback', (req, res) => {

const form=new formidable.IncomingForm()

form.parse(req, (err, fields, file)=>{

    
    
/* import checksum generation utility */
// var PaytmChecksum = require("./PaytmChecksum");

paytmChecksum = fields.CHECKSUMHASH;
delete fields.CHECKSUMHASH;

var isVerifySignature = PaymentChecksum.verifySignature(fields, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
if (isVerifySignature) {
	
     var paytmParams = {};
    paytmParams["MID"]     = fields.MID;
    paytmParams["ORDERID"] = fields.ORDERID;
    
    /*
    * Generate checksum by parameters we have
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    PaytmChecksum.generateSignature(paytmParams, process.env.PAYTM_MERCHANT_KEY).then(function(checksum){
    
        paytmParams["CHECKSUMHASH"] = checksum;
    
        var post_data = JSON.stringify(paytmParams);
    
        var options = {
    
            /* for Staging */
            hostname: 'securegw-stage.paytm.in',
    
            /* for Production */
            // hostname: 'securegw.paytm.in',
    
            port: 443,
            path: '/order/status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };
    
        var response = "";
        var post_req = https.request(options, function(post_res) {
            post_res.on('data', function (chunk) {
                response += chunk;
            });
    
            post_res.on('end', function(){
                         let result=JSON.parse(response)
                        if(result.STATUS==='TXN_SUCCESS')
                        {
                            //store in db
                            db.collection('payments').doc('mPDd5z0pNiInbSIIotfj').update({paymentHistory:firebase.firestore.FieldValue.arrayUnion(result)})
                            .then(()=>console.log("Update success"))
                            .catch(()=>console.log("Unable to update"))
                        }

                        res.redirect(`http://localhost:3000/status/${result.ORDERID}`)


            });
        });
    
        post_req.write(post_data);
        post_req.end();
    });        
            




} else {
	console.log("Checksum Mismatched");
}





})

})

router.post('/payment', (req, res)=> {


    const{amount, email} =req.body


    const totalAmount=JSON.stringify(amount)
/* import checksum generation utility */

var params = {};

/* initialize an array */
// paytmParams["MID"] = "YOUR_MID_HERE";
// paytmParams["ORDERID"] = "YOUR_ORDER_ID_HERE";
     params['MID'] = process.env.PAYTM_MID,
     params['WEBSITE'] = process.env.PAYTM_WEBSITE,
     params['CHANNEL_ID'] = process.env.PAYTM_CHANNEl_ID,
     params['INDUSTRY_TYPE_ID'] = process.env.PAYTM_INDUSTRY_TYPE_ID,
     params['ORDER_ID'] = uuidv4(),
     params['CUST_ID'] = process.env.PAYTM_CUST_ID,
     params['TXN_AMOUNT'] = totalAmount,
     params['CALLBACK_URL'] = 'http://localhost:5000/api/callback',
     params['EMAIL'] = email,
     params['MOBILE_NO'] = '8569874521'

/**
* Generate checksum by parameters we have
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
var paytmChecksum = PaymentChecksum.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
paytmChecksum.then(function(checksum){
      let paytmParams={
        ...params,
        "CHECKSUMHASH":checksum
      }
      res.json(paytmParams)
}).catch(function(error){
	console.log(error);
});

})

module.exports = router