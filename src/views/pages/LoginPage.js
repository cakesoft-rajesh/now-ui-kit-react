import Web3 from "web3";
import { Link } from "react-router-dom";
import React, { Component } from "react";
import WalletConnect from "walletconnect";
import {
  Row,
  Col,
  Input,
  Form,
  FormGroup,
  Button,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import ConnectWalletPage from "./ConnectWalletPage";
import PageSpinner from "../../components/PageSpinner";
import membershipABI from "../../contracts_abi/membership.json";
import membershipWithExpiryABI from "../../contracts_abi/membershipExpiry.json";
import * as Server from "../../utils/Server";
import * as NetworkData from "utils/networks";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"
import OTPPage from "./OTPPage";
import GenerateKeyPage from "./GenerateKeyPage";
import ReconstructKeyPage from "./ReconstructKeyPage";
import SelectedCommunityPage from "./SelectedCommunityPage";

const wc = new WalletConnect();

class LoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: "",
      ztiAppNameData: {},
      showOTPage: false,
      reconstructKeyPage: false,
      showConnectWalletPage: false,
      selectCommunityPage: true,
      editKeyFactorPage: false,
      rpcUrl: "https://rpc-mumbai.maticvigil.com",
    };
  }

  async componentDidMount() {
    const ztiAppNameData = GeneralFunctions.getZTIAppNameData();
    if (ztiAppNameData) this.setState({ ztiAppNameData, selectCommunityPage: false });
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    localStorage.setItem("membershipWithExpiry", params.membershipWithExpiry ? params.membershipWithExpiry : false);
    if (params.dokuId) localStorage.setItem("dokuId", params.dokuId);
    const signupOrLoginMethod = localStorage.getItem("signupOrLoginMethod");
    if (signupOrLoginMethod === "web3") {
      const signIn = localStorage.getItem("signIn");
      if (signIn) {
        this.setState({ showLoader: true });
        const walletAddress = localStorage.getItem("walletAddress");
        let details = navigator.userAgent;
        let regexp = /android|iphone|kindle|ipad/i;
        let isMobileDevice = regexp.test(details);
        let provider;
        if (isMobileDevice) {
          const connector = await wc.connect();
          let walletConnectProvider = await wc.getWeb3Provider({
            rpc: {
              [connector.chainId]: await NetworkData.networks[connector.chainId],
            },
          });
          await walletConnectProvider.enable();
          provider = walletConnectProvider;
        } else {
          provider = Web3.givenProvider;
        }
        const web3 = new Web3(provider);
        this.checkIfDataStoredOnBlockchain(web3, walletAddress);
      } else {
        const walletAddress = localStorage.getItem("walletAddress");
        const tokenId = localStorage.getItem("tokenId");
        if (walletAddress && tokenId) {
          this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
        }
      }
    } else if (signupOrLoginMethod === "web2") {
      let user = localStorage.getItem("user");
      if (user) {
        user = JSON.parse(user);
        this.props.history.push({
          pathname: "/profile-detail-page",
          state: {
            email: user.emails[0].address,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            userName: user.username,
            displayUsername: user.displayUsername,
            signupMethod: "web2",
            walletAddress: user.walletAddress
          }
        });
      } else {
        this.props.history.push({
          pathname: "/profile-page",
          state: {
            signupMethod: "web2",
          }
        });
      }
    }
  }

  checkIfDataStoredOnBlockchain = async (web3, walletAddress) => {
    const membershipWithExpiry = GeneralFunctions.getMembershipWithExpiry();
    const contractAddress = membershipWithExpiry
      ? process.env.REACT_APP_CONTRACT_ADDRESS_WITH_EXPIRY
      : process.env.REACT_APP_CONTRACT_ADDRESS
    const membershipABI_JSON = membershipWithExpiry
      ? membershipWithExpiryABI
      : membershipABI
    const myContract = await new web3.eth.Contract(membershipABI_JSON, contractAddress);
    try {
      let tokenId = localStorage.getItem("tokenId");
      if (!tokenId) {
        let response = await Server.request({
          url: `/user/getTokenId?walletAddress=${walletAddress}`,
          method: "GET"
        });
        if (response.success && response.tokenId) {
          tokenId = response.tokenId;
        } else {
          tokenId = 1;
        }
      }
      const response = await myContract.methods
        .ownerOf(tokenId)
        .call();
      if (response && response === walletAddress) {
        this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
      } else {
        this.props.history.push({
          pathname: "/profile-page",
          state: {
            signupMethod: "web3",
            walletAddress
          }
        });
      }
    } catch (error) {
      let message = error.message || error.Error;
      if (message.toLowerCase().includes("invalid token id")) {
        this.props.history.push({
          pathname: "/profile-page",
          state: {
            signupMethod: "web3",
            walletAddress
          }
        });
      } else {
        this.notificationSystem.addNotification({
          message,
          level: "error",
        });
      }
    }
  }

  sendOTP = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/sendOTP",
        method: "POST",
        data: {
          email: this.state.email
        }
      });
      if (response.success) {
        this.setState({ showLoader: false, showOTPage: true });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  toggleConnectWalletPage = () => {
    this.setState({ showConnectWalletPage: !this.state.showConnectWalletPage });
  };

  updateStateValue = (value) => this.setState(value);

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <div
          style={{
            flexDirection: "column",
            display: "flex",
            marginTop: 20,
          }}
        >
          {
            this.state.showOTPage &&
            <OTPPage
              fromPage="loginPage"
              email={this.state.email}
              updateStateValue={this.updateStateValue}
            />
          }
          {
            this.state.reconstructKeyPage &&
            <ReconstructKeyPage
              email={this.state.email}
              updateStateValue={this.updateStateValue}
            />
          }
          {this.state.editKeyFactorPage &&
            <GenerateKeyPage
              {...this.props}
              email={this.state.email}
              walletAddress={localStorage.getItem("walletAddress")}
              updateStateValue={this.updateStateValue}
              editKeyFactor={true}
              fromPage="loginPage"
            />
          }
          {
            this.state.showConnectWalletPage &&
            <ConnectWalletPage
              {...this.props}
              fromPage="loginPage"
            />
          }
          {
            this.state.selectCommunityPage &&
            <SelectedCommunityPage
              updateStateValue={this.updateStateValue}
            />
          }
          {
            !this.state.showOTPage &&
            !this.state.reconstructKeyPage &&
            !this.state.showConnectWalletPage &&
            !this.state.selectCommunityPage &&
            !this.state.editKeyFactorPage &&
            <Row style={{ justifyContent: "center", alignItems: "center" }}>
              <Col
                sm="12"
                style={{
                  width: "90%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Row
                  style={{
                    justifyContent: "end",
                    alignItems: "center",
                  }}
                >
                  <Button
                    style={{
                      padding: "13px 30px",
                      fontSize: "15px",
                      fontWeight: "bold",
                      marginBottom: "30px",
                    }}
                    className="btn-round"
                    color="info"
                    type="button"
                    size="lg"
                    outline
                    to="/signup-page"
                    tag={Link}
                  >
                    Sign Up
                  </Button>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img
                    alt=""
                    src={`/logos/${this.state.ztiAppNameData.logo}`}
                    width="30%"
                    style={{ marginTop: 40 }}
                  />
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ color: "gray", marginTop: 15, fontWeight: 600 }}>{this.state.ztiAppNameData.label}</h3>
                </Row>
                <Row
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ color: "gray", margin: 0 }}>Login with email</h3>
                </Row>
                {/* Email login with OTP */}
                <Form onSubmit={(event) => this.sendOTP(event)}>
                  <Row
                    style={{
                      justifyContent: "center",
                      marginLeft: 10,
                      marginRight: 10,
                      marginTop: 20,
                    }}
                  >
                    <FormGroup style={{ width: "100%" }}>
                      <Input
                        style={{
                          width: "100%",
                          borderColor: "gray",
                        }}
                        placeholder="Enter email"
                        type="email"
                        value={this.state.email}
                        onChange={(event) =>
                          this.setState({ email: event.target.value })
                        }
                        required
                      ></Input>
                    </FormGroup>
                  </Row>
                  <Row style={{ justifyContent: "center", alignItems: "center", margin: "0px 10px" }}>
                    <Button
                      style={{
                        width: "100%",
                        padding: "13px 0px",
                        fontSize: "15px",
                        fontWeight: "bold",
                      }}
                      className="btn-round"
                      color="info"
                      type="submit"
                      size="lg"
                    >
                      Log in
                    </Button>
                  </Row>
                </Form>
                <Row
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center"
                  }}
                >
                  <label
                    style={{
                      color: "gray",
                      margin: 0,
                      marginTop: 10,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onClick={this.toggleConnectWalletPage}
                  >
                    OR login with an existing connected wallet
                  </label>
                </Row>
              </Col>
            </Row>
          }
        </div>
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
      </>
    );
  }
}

export default LoginPage;