// import Web3 from "web3";
import Swal from "sweetalert2";
import React, { Component } from "react";
// import WalletConnect from "walletconnect";
import {
  Row,
  Col,
  Input,
  Form,
  FormGroup,
  Button,
} from "reactstrap";
import PageSpinner from "../../components/PageSpinner";
// import membershipABI from "../../contracts_abi/membership.json";
import config from "../../config";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";
import "react-spring-bottom-sheet/dist/style.css"

// const wc = new WalletConnect();

class LoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      email: "",
      emailForSignup: "",
      ztiAppNameData: {},
      rpcUrl: config.rpcUrl
    };
  }

  async componentDidMount() {
    // let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    // if (params.walletAddress) {
    //   localStorage.setItem("walletAddressExistsOnPhone", true);
    //   localStorage.setItem("walletAddress", params.walletAddress);
    // }
    const ztiAppNameData = GeneralFunctions.getZTIAppNameData();
    if (ztiAppNameData) this.setState({ ztiAppNameData });
    // if (params.dokuId) localStorage.setItem("dokuId", params.dokuId);
    // const signIn = localStorage.getItem("signIn");
    // if (signIn) {
    //   this.setState({ showLoader: true });
    //   const walletAddress = localStorage.getItem("walletAddress");
    //   let details = navigator.userAgent;
    //   let regexp = /android|iphone|kindle|ipad/i;
    //   let isMobileDevice = regexp.test(details);
    //   let provider;
    //   if (isMobileDevice) {
    //     const connector = await wc.connect();
    //     let walletConnectProvider = await wc.getWeb3Provider({
    //       rpc: {
    //         [connector.chainId]: await config.networks[connector.chainId],
    //       },
    //     });
    //     await walletConnectProvider.enable();
    //     provider = walletConnectProvider;
    //   } else {
    //     provider = Web3.givenProvider;
    //   }
    //   const web3 = new Web3(provider);
    //   this.checkIfDataStoredOnBlockchain(web3, walletAddress);
    // } else {
    //   const walletAddress = localStorage.getItem("walletAddress");
    //   const tokenId = localStorage.getItem("tokenId");
    //   if (walletAddress && tokenId) {
    //     this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
    //   }
    // }
  }

  // checkIfDataStoredOnBlockchain = async (web3, walletAddress) => {
  //   const myContract = await new web3.eth.Contract(membershipABI, config.REACT_APP_CONTRACT_ADDRESS);
  //   try {
  //     let tokenId = localStorage.getItem("tokenId");
  //     const response = await myContract.methods
  //       .ownerOf(tokenId)
  //       .call();
  //     if (response && response === walletAddress) {
  //       this.props.history.push(`/profile-detail-page?walletAddress=${walletAddress}&tokenId=${tokenId}`);
  //     } else {
  //       this.props.history.push({
  //         pathname: "/profile-page",
  //         state: {
  //           walletAddress
  //         }
  //       });
  //     }
  //   } catch (error) {
  //     let message = error.message || error.Error;
  //     if (message.toLowerCase().includes("invalid token id")) {
  //       this.props.history.push({
  //         pathname: "/profile-page",
  //         state: {
  //           walletAddress
  //         }
  //       });
  //     } else {
  //       Swal.fire({
  //         icon: "error",
  //         text: message,
  //         confirmButtonText: "OK",
  //         confirmButtonColor: "#2CA8FF"
  //       });
  //     }
  //   }
  // }

  sendOTP = async (event, otpFor) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let response = await Server.request({
        url: "/email/sendOTP",
        method: "POST",
        data: {
          email: otpFor === 'login' ? this.state.email : this.state.emailForSignup
        }
      });
      if (response.success) {
        this.props.history.push({
          pathname: "/otp-page",
          state: {
            fromPage: otpFor === 'login' ? "loginPage" : "signupPage",
            email: otpFor === 'login' ? this.state.email : this.state.emailForSignup,
            otpExpiryTime: response.otpExpiryTime
          }
        });
      }
    } catch (error) {
      this.setState({ showLoader: false });
      Swal.fire({
        icon: "error",
        text: error.message,
        confirmButtonText: "OK",
        confirmButtonColor: "#2CA8FF"
      });
    }
  };

  render() {
    return (
      <>
        {
          this.state.showLoader
            ? <PageSpinner showLoader={this.state.showLoader} />
            : <div
              style={{
                flexDirection: "column",
                display: "flex",
                marginTop: 20,
              }}
            >
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
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <img
                      alt=""
                      src={`/logos/${this.state.ztiAppNameData.logo}`}
                      width="30%"
                    />
                  </Row>
                  <Row
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center"
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
                    <h3 style={{ color: "gray", margin: 0 }}>Log in with email</h3>
                  </Row>
                  {/* Email login with OTP */}
                  <Form onSubmit={(event) => this.sendOTP(event, "login")}>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                        marginTop: 10,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <Input
                          style={{
                            width: "100%",
                            borderColor: "gray",
                            fontSize: "15px"
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
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        By logging in you are agreeing to ZTI's{" "}
                        <a
                          style={{ color: "blue" }}
                          target="_blank"
                          rel="noreferrer"
                          href="https://zocial.io/termsOfService.html"
                        >
                          Terms of Service
                        </a>{" "}
                        and Doku's{" "}
                        <a
                          style={{ color: "blue" }}
                          target="_blank"
                          rel="noreferrer"
                          href="https://file.zocial.io/doku/DOKUPlus_TNC.pdf"
                        >
                          Terms of Use
                        </a>
                      </label>
                    </Row>
                  </Form>
                  <Row
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: 10
                    }}
                  >
                    <h2 style={{ color: "gray", margin: 0, fontWeight: 600 }}>OR</h2>
                  </Row>
                  <Row
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <h3 style={{ color: "gray", margin: 0 }}>Sign up with email</h3>
                  </Row>
                  {/* Email signup with OTP */}
                  <Form onSubmit={(event) => this.sendOTP(event, "signup")}>
                    <Row
                      style={{
                        justifyContent: "center",
                        marginLeft: 10,
                        marginRight: 10,
                        marginTop: 10,
                      }}
                    >
                      <FormGroup style={{ width: "100%" }}>
                        <Input
                          style={{
                            width: "100%",
                            borderColor: "gray",
                            fontSize: "15px"
                          }}
                          placeholder="Enter email"
                          type="email"
                          value={this.state.emailForSignup}
                          onChange={(event) =>
                            this.setState({ emailForSignup: event.target.value })
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
                        Sign up
                      </Button>
                    </Row>
                  </Form>
                  {/* <Row
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
                      onClick={() => this.props.history.push({
                        pathname: "/connect-wallet-page",
                        state: {
                          fromPage: "loginPage"
                        }
                      })}
                    >
                      OR login with an existing connected wallet
                    </label>
                  </Row> */}
                </Col>
              </Row>
            </div>
        }
      </>
    );
  }
}

export default LoginPage;