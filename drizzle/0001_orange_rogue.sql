CREATE TABLE `idDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`frontImageKey` varchar(500),
	`frontImageUrl` varchar(500),
	`backImageKey` varchar(500),
	`backImageUrl` varchar(500),
	`verificationStatus` enum('pending','reviewing','verified','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `idDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loanApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loanAmount` decimal(12,2) NOT NULL,
	`loanDurationMonths` int NOT NULL,
	`purpose` varchar(255) NOT NULL,
	`repaymentMethod` enum('equal_principal_interest','equal_principal','bullet') NOT NULL,
	`interestRate` decimal(5,2),
	`status` enum('待審核','審核中','已核准','撥款中','還款中','已結清','已拒絕') NOT NULL DEFAULT '待審核',
	`adminNote` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`approvedAt` timestamp,
	`disbursedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loanApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanId` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`amountDue` decimal(12,2) NOT NULL,
	`amountPaid` decimal(12,2) DEFAULT '0',
	`status` enum('pending','paid','overdue','partial') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`recordedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(100),
	`idNumber` varchar(20),
	`phone` varchar(20),
	`address` text,
	`occupation` varchar(100),
	`monthlyIncome` decimal(12,2),
	`profileCompleted` enum('incomplete','complete') NOT NULL DEFAULT 'incomplete',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
