import React from "react";
import { Link } from "react-router-dom";
// reactstrap components
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
} from "reactstrap";


function LoginPage() {
  return (
    <div
      style={{
        height: "100vh",
        justifyContent: "center",
        flexDirection: "column",
        display: "flex",
      }}
    >
      <Row style={{ justifyContent: "center", alignItems: "center" }}>
        <Col
          md="3"
          sm="4"
          style={{ justifyContent: "center", alignItems: "center" }}
        >
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 35,
            }}
          >
            <Button className="btn-round" color="info" type="button" size="lg">
              Connect Web3 Wallet
            </Button>
          </Row>
          <hr
            style={{
              color: "gray",
              backgroundColor: "gray",
              height: 1,
              marginLeft: 40,
              marginRight: 40,
            }}
          />
          <div
            style={{
              backgroundColor: "gray",
              width: 26,
              height: 26,
              borderRadius: 20,
              padding: 2,
              position: "absolute",
              top: "21%",
              left: "47%",
            }}
          >
            <h7 style={{ color: "white" }}>OR</h7>
          </div>
          <Row
            style={{
              justifyContent: "center",
              alignItems: "center",
              marginTop: 35,
            }}
          >
            <h3 style={{ color: "gray" }}>Sign up with email</h3>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              marginLeft: 30,
              marginRight: 40,
            }}
          >
            <FormGroup style={{ width: "100%" }}>
              <Input
                style={{ marginBottom: 10, width: "100%", borderColor: 'gray' }}
                defaultValue=""
                placeholder="Enter email"
                type="email"
              ></Input>
              <Input
                style={{ marginBottom: 10, width: "100%", borderColor: 'gray' }}
                defaultValue=""
                placeholder="create password"
                type="password"
              ></Input>
              <Input
                style={{ marginBottom: 30, width: "100%", borderColor: 'gray' }}
                defaultValue=""
                placeholder="confirm password"
                type="password"
              ></Input>
            </FormGroup>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button className="btn-round" color="info" type="button" size="lg" to="/profile-page" tag={Link}>
              Sign up
            </Button>
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default LoginPage;