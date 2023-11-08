import React, { Component } from "react";
import {
  Row,
  Col,
  Input,
} from "reactstrap";
import { BiSearch } from "react-icons/bi"
import * as GeneralFunctions from "../../utils/GeneralFunctions";

const intialValue = [
  {
    label: "PT. Zocial Teknologi Indonesia",
    value: "zti",
    logo: "zti.png"
  },
  {
    label: "OWN",
    value: "own",
    logo: "own.png"
  },
  {
    label: "Kentungan",
    value: "kentungan",
    logo: "kentungan.png"
  }
];

class SelectedCommunityPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      ztiAppName: "",
      allCommunityList: intialValue,
      communityList: intialValue,
    };
  }

  async componentDidMount() {
    let params = await GeneralFunctions.getQueryStringParams(window.location.search);
    if (params.walletAddress) {
      localStorage.setItem("walletAddressExistsOnPhone", true);
      localStorage.setItem("walletAddress", params.walletAddress);
    }
  }

  render() {
    return (
      <div
        style={{
          flexDirection: "column",
          display: "flex",
          marginTop: 20,
        }}
      >
        <Row>
          <Col style={{ textAlign: "center" }}>
            <h4 style={{ color: "gray", margin: 0, fontWeight: 600 }}>
              Select your Community
            </h4>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col className="d-flex align-items-center">
            <Input
              style={{
                width: "100%",
                marginRight: 10,
                borderColor: "gray",
                padding: "10px 12px",
                fontSize: "15px"
              }}
              placeholder="Search for your community"
              type="ztiAppName"
              value={this.state.ztiAppName}
              onChange={(event) => {
                const regex = new RegExp(event.target.value, "i");
                const communityList = this.state.allCommunityList.filter(appName => appName.value.match(regex));
                this.setState({ ztiAppName: event.target.value, communityList: communityList ? communityList : this.state.allCommunityList })
              }}
            />
            <BiSearch size="30" />
          </Col>
        </Row>
        {this.state.communityList.map((appName, index) =>
          <Row key={index} className={index === 0 ? "mt-4" : "mt-3"}>
            <Col
              className="d-flex align-items-center"
              style={{
                padding: "20px 15px",
                margin: "0px 15px",
                borderRadius: "10px",
                background: "#f2f2f2",
                cursor: "pointer"
              }}
              onClick={() => {
                if (appName.value === "zti") {
                  GeneralFunctions.setZTIAppNameData(appName);
                  this.props.history.push("/login-page");
                }
              }}
            >
              <img
                alt=""
                src={`/logos/${appName.logo}`}
                width="15%"
                style={{ marginLeft: "10px" }}
              />
              <h5
                style={{
                  color: "gray",
                  margin: 0,
                  marginLeft: 15,
                  fontWeight: 600
                }}>
                {appName.label}
              </h5>
            </Col>
          </Row>
        )}
      </div>
    );
  }
}

export default SelectedCommunityPage;