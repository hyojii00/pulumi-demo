import { Config } from "@pulumi/pulumi";
import { RandomPassword } from "@pulumi/random";
import { Database } from "./database";
import { Vpc } from "./network";

// $ pulumi config set aws:region ap-northeast-1

// Get config data
const config = new Config();
const serviceName = config.get("serviceName") || "pulumi-rds-demo";
const dbName = config.get("dbName") || "pulumi";
const dbUser = config.get("dbUser") || "admin";

// Get secretified password from config or create one using the "random" package
let dbPassword = config.getSecret("dbPassword");
if (!dbPassword) {
	dbPassword = new RandomPassword("dbPassword", {
		length: 16,
		special: true,
		overrideSpecial: "_%",
	}).result;
}

// Create a new VPC for our RDS instance
const vpc = new Vpc(`${serviceName}-net`, {});

// Create the PostgreSQL RDS instance
const db = new Database(`${serviceName}-db`, {
	dbName: dbName,
	dbUser: dbUser,
	dbPassword: dbPassword,
	subnetIds: vpc.subnetIds,
	securityGroupIds: vpc.rdsSecurityGroupIds,
});

// Export the RDS instance endpoint
export const databaseEndpoint = db.dbAddress;
export const databaseUserName = db.dbUser;
export const databasePassword = db.dbPassword;
