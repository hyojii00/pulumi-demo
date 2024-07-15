// Copyright 2016-2019, Pulumi Corporation.  All rights reserved.

import { rds } from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Interface for backend args
export interface DbArgs {
	dbName: string;
	dbUser: string;
	dbPassword: pulumi.Output<string>;
	subnetIds: pulumi.Output<string>[];
	securityGroupIds: pulumi.Output<string>[];
}

// Creates Database
export class Database extends pulumi.ComponentResource {
	public readonly dbAddress: pulumi.Output<string>;
	public readonly dbName: pulumi.Output<string>;
	public readonly dbUser: pulumi.Output<string>;
	public readonly dbPassword: pulumi.Output<string | undefined>;

	constructor(
		name: string,
		args: DbArgs,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("custom:resource:DB", name, args, opts);

		// Create RDS subnet grup
		const rdsSubnetGroupName = `${name}-sng`;
		const rdsSubnetGroup = new rds.SubnetGroup(
			rdsSubnetGroupName,
			{
				subnetIds: args.subnetIds,
				tags: { Name: rdsSubnetGroupName },
			},
			{ parent: this },
		);

		// RDS DB
		const rdsName = `${name}-rds`;
		const db = new rds.Instance(
			rdsName,
			{
				dbName: args.dbName, // 생성할 데이터베이스의 이름
				username: args.dbUser, // 데이터베이스에 접근할 사용자 이름
				password: args.dbPassword, // 데이터베이스에 접근할 사용자의 비밀번호
				vpcSecurityGroupIds: args.securityGroupIds, // VPC 보안 그룹 ID 목록
				dbSubnetGroupName: rdsSubnetGroup.name, // DB 서브넷 그룹 이름
				allocatedStorage: 20, // 할당된 스토리지 크기 (GB 단위)
				engine: "postgres", // 사용할 데이터베이스 엔진
				engineVersion: "13", // 데이터베이스 엔진의 버전 (최신 LTS 버전)
				instanceClass: "db.t3.micro", // 인스턴스 클래스 (성능 사양)
				storageType: "gp2", // 스토리지 타입 (일반 목적 SSD)
				skipFinalSnapshot: true, // 최종 스냅샷 생성을 건너뜀
				publiclyAccessible: true, // 퍼블릭 접근 가능 여부
			},
			{ parent: this },
		); // 부모 리소스 설정

		this.dbAddress = db.address;
		this.dbName = db.dbName;
		this.dbUser = db.username;
		this.dbPassword = db.password;

		this.registerOutputs({});
	}
}
