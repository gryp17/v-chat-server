
CREATE TABLE `user` (
	`id` int(11) AUTO_INCREMENT PRIMARY KEY,
	`username` varchar(20) NOT NULL,
	`password` varchar(80) NOT NULL,
	`avatar` varchar(80) DEFAULT NULL,
	`created` datetime NOT NULL
);