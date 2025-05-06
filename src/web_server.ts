import express from 'express';
import cors from "cors";
import bodyParser from 'body-parser';
import * as config from './config'
import * as controller from './controller'

const app = express();
const port = config.WEB_SERVER_PORT;

// 使用 body-parser 中间件解析请求体
app.use(bodyParser.json());

// 允许跨域
app.use(cors());

//允许指定域名跨域
// app.use(
//     cors({
//       origin: "http://localhost:3000",
//       methods: ["GET","POST","OPTIONS"],
//       allowedHeaders: ["Content-Type","Authorization"],
//     })
//   );



app.post('/walletauth/createsuborg', controller.apiCreateSubOrgByWalletAuth);
app.post('/walletauth/getsuborg', controller.apiGetSubOrgByWalletAuth);

app.post('/emailauth/sendemailotp', controller.apiGetSubOrgByEmail);
app.post('/emailauth/otpauth', controller.apiOTPAuth);
app.post('/oauth/verify', controller.apiOAuth);
// app.post('/walletauth/deletesuborg', controller.apiDeleteSubOrg);
//此接口不该队外，仅作测试
app.post('/walletauth/delegatesigntx', controller.apiDelegateSignTxTest);
app.post('/walletauth/testkeypair', controller.apiTestKeypair);

export async function startWebServer() {
    // 启动服务
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}