-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 20 mars 2026 à 10:53
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `vacationrentaldb`
--

-- --------------------------------------------------------

--
-- Structure de la table `admin`
--

CREATE TABLE `admin` (
  `AdminId` int(11) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(300) NOT NULL,
  `UserId` int(11) NOT NULL,
  `PropertyId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `advertpackage`
--

CREATE TABLE `advertpackage` (
  `PackageId` int(11) NOT NULL,
  `PackageName` varchar(100) NOT NULL,
  `PackageType` enum('Free','Premium','Boost') NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `DurationDays` int(11) NOT NULL,
  `MaxImages` int(11) DEFAULT 3,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `ChargilyProductId` varchar(255) DEFAULT NULL,
  `ChargilyPriceId` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `advertpackage`
--

INSERT INTO `advertpackage` (`PackageId`, `PackageName`, `PackageType`, `Price`, `DurationDays`, `MaxImages`, `CreatedAt`, `ChargilyProductId`, `ChargilyPriceId`) VALUES
(3, 'Weekly Boost', 'Boost', 1000.00, 7, 10, '2026-02-28 08:51:42', '01kk44ws5bvhhgtvejmtywf8bx', '01kk44ws5bvhhgtvejmtywf8bx'),
(4, 'Premium Listing', 'Premium', 3000.00, 30, 15, '2026-03-05 14:00:02', '01kk4516qy7f9b08253fwt5647', '01kk4516qy7f9b08253fwt5647');

-- --------------------------------------------------------

--
-- Structure de la table `benefits_from`
--

CREATE TABLE `benefits_from` (
  `PromotionId` int(11) NOT NULL,
  `BookingId` int(11) DEFAULT NULL,
  `PropertyId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `benefits_from`
--

INSERT INTO `benefits_from` (`PromotionId`, `BookingId`, `PropertyId`) VALUES
(18, NULL, 5),
(20, NULL, 8);

-- --------------------------------------------------------

--
-- Structure de la table `booking`
--

CREATE TABLE `booking` (
  `BookingId` int(11) NOT NULL,
  `UserId` int(11) NOT NULL,
  `PropertyId` int(11) NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `LengthOfStay` int(11) NOT NULL,
  `TotalPrice` decimal(10,2) NOT NULL,
  `BookingStatus` enum('Confirmed','Cancelled','Completed','Pending') NOT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `BasePrice` decimal(10,2) NOT NULL,
  `DiscountAmount` decimal(10,2) NOT NULL,
  `OwnerShare` decimal(10,2) DEFAULT 0.00,
  `PlatformFee` decimal(10,2) DEFAULT 0.00,
  `PaymentReference` varchar(255) DEFAULT NULL,
  `PaymentDate` datetime DEFAULT NULL,
  `OwnerPaidOut` tinyint(1) DEFAULT 0,
  `PayoutDate` datetime DEFAULT NULL,
  `PayoutMethod` varchar(50) DEFAULT NULL,
  `PayoutReference` varchar(255) DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `booking`
--

INSERT INTO `booking` (`BookingId`, `UserId`, `PropertyId`, `StartDate`, `EndDate`, `LengthOfStay`, `TotalPrice`, `BookingStatus`, `PhoneNumber`, `BasePrice`, `DiscountAmount`, `OwnerShare`, `PlatformFee`, `PaymentReference`, `PaymentDate`, `OwnerPaidOut`, `PayoutDate`, `PayoutMethod`, `PayoutReference`, `CreatedAt`) VALUES
(4, 1, 5, '2026-03-03', '2026-03-04', 1, 11000.00, 'Confirmed', '0699787702', 11000.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, NULL, NULL, '2026-03-13 09:05:33'),
(7, 1, 5, '2026-03-03', '2026-03-04', 1, 11000.00, 'Completed', '0699787702', 11000.00, 0.00, 0.00, 0.00, NULL, NULL, 0, NULL, NULL, NULL, '2026-03-13 09:05:33');

-- --------------------------------------------------------

--
-- Structure de la table `conversation`
--

CREATE TABLE `conversation` (
  `ConversationId` int(11) NOT NULL,
  `RenterId` int(11) NOT NULL,
  `OwnerId` int(11) NOT NULL,
  `PropertyId` int(11) DEFAULT NULL,
  `LastMessageAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `conversation`
--

INSERT INTO `conversation` (`ConversationId`, `RenterId`, `OwnerId`, `PropertyId`, `LastMessageAt`) VALUES
(3, 1, 2, 5, '2026-03-09 17:17:01'),
(10, 1, 2, 8, '2026-03-18 10:31:09');

-- --------------------------------------------------------

--
-- Structure de la table `feature`
--

CREATE TABLE `feature` (
  `FeatureId` int(11) NOT NULL,
  `FeatureName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `feature`
--

INSERT INTO `feature` (`FeatureId`, `FeatureName`) VALUES
(1, 'wifi'),
(2, 'parking'),
(4, 'wifi'),
(5, 'Air condition');

-- --------------------------------------------------------

--
-- Structure de la table `has_features`
--

CREATE TABLE `has_features` (
  `PropertyId` int(11) NOT NULL,
  `FeatureId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `has_features`
--

INSERT INTO `has_features` (`PropertyId`, `FeatureId`) VALUES
(5, 1),
(5, 2),
(8, 4),
(8, 5);

-- --------------------------------------------------------

--
-- Structure de la table `message`
--

CREATE TABLE `message` (
  `MessageId` int(11) NOT NULL,
  `SenderId` int(11) NOT NULL,
  `ReceiverId` int(11) NOT NULL,
  `PropertyId` int(11) DEFAULT NULL,
  `MessageText` text NOT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `SentAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `message`
--

INSERT INTO `message` (`MessageId`, `SenderId`, `ReceiverId`, `PropertyId`, `MessageText`, `IsRead`, `SentAt`) VALUES
(3, 1, 2, 5, 'slm', 1, '2026-03-03 20:23:36'),
(4, 1, 2, 5, 'prix?', 1, '2026-03-03 20:23:43'),
(5, 1, 2, 5, 'hi', 1, '2026-03-04 16:18:18'),
(6, 1, 2, 5, 'hi', 1, '2026-03-04 16:29:24'),
(7, 2, 1, 5, 'ok', 1, '2026-03-04 16:39:00'),
(8, 1, 2, 5, 'hhh', 1, '2026-03-08 10:11:21'),
(9, 1, 2, 5, 'hi', 1, '2026-03-09 16:31:27'),
(10, 1, 2, 8, 'hi', 1, '2026-03-09 16:31:37'),
(11, 2, 1, 5, 'ok', 1, '2026-03-09 17:17:01'),
(12, 2, 1, 8, 'h', 1, '2026-03-18 10:31:09');

-- --------------------------------------------------------

--
-- Structure de la table `payment`
--

CREATE TABLE `payment` (
  `PaymentId` int(11) NOT NULL,
  `BookingId` int(11) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `PaymentDate` date NOT NULL,
  `PaymentMethod` enum('Card','Cash','Transfer') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `payment_history`
--

CREATE TABLE `payment_history` (
  `PaymentId` int(11) NOT NULL,
  `PaymentType` enum('Package','Booking') NOT NULL,
  `ReferenceId` int(11) NOT NULL,
  `PayerId` int(11) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `PlatformFee` decimal(10,2) DEFAULT 0.00,
  `RecipientShare` decimal(10,2) DEFAULT 0.00,
  `ChargilyCheckoutId` varchar(255) DEFAULT NULL,
  `PaymentStatus` enum('Pending','Completed','Failed') DEFAULT 'Pending',
  `PaymentDate` datetime DEFAULT NULL,
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `payment_history`
--

INSERT INTO `payment_history` (`PaymentId`, `PaymentType`, `ReferenceId`, `PayerId`, `Amount`, `PlatformFee`, `RecipientShare`, `ChargilyCheckoutId`, `PaymentStatus`, `PaymentDate`, `CreatedAt`) VALUES
(1, 'Booking', 8, 1, 11000.00, 1000.00, 10000.00, '01kk1p0w2a96a1bdxtpf35bmyj', 'Pending', NULL, '2026-03-06 13:40:02'),
(2, 'Booking', 9, 1, 11000.00, 1000.00, 10000.00, '01kk1pkjtgmjma9ted7qeqg544', 'Pending', NULL, '2026-03-06 13:50:15'),
(3, 'Booking', 10, 1, 11000.00, 1000.00, 10000.00, '01kk1q9nseh9nvc9fn50aj01jy', 'Pending', NULL, '2026-03-06 14:02:19'),
(4, 'Booking', 11, 1, 11000.00, 1000.00, 10000.00, '01kk9q305cfyqm62fyjh90xmkd', 'Pending', NULL, '2026-03-09 16:32:37'),
(5, 'Booking', 13, 1, 2000.00, 181.82, 1818.18, '01kkcaprr8hvst8yyaetvv36xr', 'Pending', NULL, '2026-03-10 16:53:56'),
(6, 'Booking', 14, 1, 2000.00, 181.82, 1818.18, '01kkk56p84ewmt12pmmc5zjknc', 'Pending', NULL, '2026-03-13 08:32:28'),
(7, 'Booking', 15, 1, 2000.00, 181.82, 1818.18, '01kkk5ngk282yjfjrem41nngeg', 'Pending', NULL, '2026-03-13 08:40:33'),
(8, 'Booking', 16, 1, 2000.00, 181.82, 1818.18, '01kkk5r74vqy5tnynh16mf6dnq', 'Pending', NULL, '2026-03-13 08:42:02'),
(9, 'Booking', 17, 1, 2500.00, 227.27, 2272.73, '01kkk68r7cyw7d6dr36a1txggb', 'Pending', NULL, '2026-03-13 08:51:04'),
(10, 'Booking', 18, 1, 2500.00, 227.27, 2272.73, '01kkk6kew8fyr9t36hfdxyzh56', 'Pending', NULL, '2026-03-13 08:56:55'),
(11, 'Booking', 19, 1, 2500.00, 227.27, 2272.73, '01kkk6q5c1k57zpxwb5a07hkac', 'Pending', NULL, '2026-03-13 08:58:56'),
(12, 'Booking', 20, 1, 2500.00, 227.27, 2272.73, '01kkk77t6xq7rksva6hw7672gd', 'Pending', NULL, '2026-03-13 09:08:02'),
(13, 'Booking', 21, 1, 2500.00, 227.27, 2272.73, '01kkk7pf7zh1gngfh8nsw45a71', 'Pending', NULL, '2026-03-13 09:16:02'),
(14, 'Booking', 22, 1, 2500.00, 227.27, 2272.73, '01kkk8xjndamwh7f9nqr9es1f1', 'Pending', NULL, '2026-03-13 09:37:23'),
(15, 'Booking', 23, 1, 2500.00, 227.27, 2272.73, '01kkk8z4xsy1t9svs3p0bsc4ht', 'Pending', NULL, '2026-03-13 09:38:15'),
(16, 'Booking', 24, 1, 2000.00, 181.82, 1818.18, '01kkkr1xaebdwbk3xv0jkdvdfx', 'Pending', NULL, '2026-03-13 14:01:54');

-- --------------------------------------------------------

--
-- Structure de la table `payment_transaction`
--

CREATE TABLE `payment_transaction` (
  `TransactionId` int(11) NOT NULL,
  `PropertyId` int(11) NOT NULL,
  `OwnerId` int(11) NOT NULL,
  `PackageId` int(11) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `PaymentMethod` varchar(50) NOT NULL,
  `PaymentStatus` enum('Pending','Completed','Failed','Refunded') NOT NULL,
  `TransactionReference` varchar(255) DEFAULT NULL,
  `PaymentDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ExpiryDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `payment_transaction`
--

INSERT INTO `payment_transaction` (`TransactionId`, `PropertyId`, `OwnerId`, `PackageId`, `Amount`, `PaymentMethod`, `PaymentStatus`, `TransactionReference`, `PaymentDate`, `ExpiryDate`) VALUES
(15, 5, 2, 3, 1000.00, 'Chargily', 'Pending', '01kjz4t8v1vzg3edfhrsf9xecx', '2026-03-05 14:00:52', NULL),
(16, 5, 2, 4, 3000.00, 'Chargily', 'Pending', '01kjz4th4e5fw6dkfbnwzyej1q', '2026-03-05 14:01:00', NULL),
(17, 5, 2, 3, 1000.00, 'Chargily', 'Pending', '01kk45ch5sr29zqfmzecj62nyh', '2026-03-07 12:47:02', NULL),
(18, 5, 2, 3, 1000.00, 'Chargily', 'Pending', '01kk45jz1q808ej0z70t3ddt4s', '2026-03-07 12:50:33', NULL),
(19, 7, 2, 3, 1000.00, 'Chargily', 'Pending', '01kk6zajxsvwwbf5avqsc1q0e4', '2026-03-08 14:58:50', NULL),
(20, 5, 2, 3, 1000.00, 'Chargily', 'Pending', '01kkcajxwnv1306dhbm5s998mq', '2026-03-10 16:51:50', NULL),
(21, 6, 2, 4, 3000.00, 'Chargily', 'Pending', '01km086baxv1yfg27ddn7w70g0', '2026-03-18 10:34:48', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `promotion`
--

CREATE TABLE `promotion` (
  `PromotionId` int(11) NOT NULL,
  `PromotionType` enum('LongStay','Seasonal','SpecialOffer') NOT NULL,
  `MinStayDays` int(11) NOT NULL,
  `DiscountType` enum('Percentage','FixedAmount') NOT NULL,
  `DiscountValue` decimal(10,2) NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `promotion`
--

INSERT INTO `promotion` (`PromotionId`, `PromotionType`, `MinStayDays`, `DiscountType`, `DiscountValue`, `StartDate`, `EndDate`) VALUES
(18, 'SpecialOffer', 1, 'FixedAmount', 1000.00, '2026-03-20', '2026-04-19'),
(19, 'SpecialOffer', 1, 'FixedAmount', 1000.00, '2026-03-20', '2026-04-19'),
(20, 'SpecialOffer', 2, 'FixedAmount', 1000.00, '2026-03-20', '2026-04-19');

-- --------------------------------------------------------

--
-- Structure de la table `property`
--

CREATE TABLE `property` (
  `PropertyId` int(11) NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `Address` varchar(255) NOT NULL,
  `City` varchar(100) NOT NULL,
  `Wilaya` varchar(100) NOT NULL,
  `Latitude` decimal(10,8) DEFAULT NULL,
  `Longitude` decimal(11,8) DEFAULT NULL,
  `PropertyType` enum('Apartment','House','Room','Cottage') NOT NULL,
  `PricePerNight` decimal(10,2) NOT NULL,
  `AvailabilityStatus` enum('Active','Inactive','Blocked') NOT NULL,
  `NumofRooms` int(11) NOT NULL,
  `OwnerId` int(11) NOT NULL,
  `IsFeatured` tinyint(1) DEFAULT 0,
  `IsBoosted` tinyint(1) DEFAULT 0,
  `FeaturedUntil` date DEFAULT NULL,
  `BoostedUntil` date DEFAULT NULL,
  `ViewCount` int(11) DEFAULT 0,
  `MainImage` varchar(500) DEFAULT NULL,
  `AverageRating` decimal(3,2) DEFAULT 0.00,
  `TotalReviews` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `property`
--

INSERT INTO `property` (`PropertyId`, `Title`, `Description`, `Address`, `City`, `Wilaya`, `Latitude`, `Longitude`, `PropertyType`, `PricePerNight`, `AvailabilityStatus`, `NumofRooms`, `OwnerId`, `IsFeatured`, `IsBoosted`, `FeaturedUntil`, `BoostedUntil`, `ViewCount`, `MainImage`, `AverageRating`, `TotalReviews`) VALUES
(5, 'Vila F5', 'A beatful vila in annaba, with sea view', 'Annaba cornich', 'Annaba,center', 'Annaba', 0.00000000, 0.00000000, 'House', 11000.00, 'Active', 5, 2, 0, 0, NULL, NULL, 154, NULL, 4.00, 1),
(6, 'Apertement f3', 'A nice Apertement in Guelma center', 'Guelma center , Swidani Bou Jam3a', 'Guelma', 'Guelma', NULL, NULL, 'Apartment', 2500.00, 'Active', 3, 2, 1, 0, '2026-04-04', NULL, 19, NULL, 0.00, 0),
(7, 'Studio ', 'A nice Studio ', 'Guelma center , Wilaya', 'Guelma', 'Guelma', NULL, NULL, 'Room', 2000.00, 'Active', 2, 2, 0, 0, NULL, '2026-03-15', 13, NULL, 0.00, 0),
(8, 'F4', 'F4 in guelma', 'Geulma/19 juan', 'Geulma', '24 - Guelma', 36.44725300, 7.42118700, 'House', 5500.00, 'Active', 4, 2, 0, 0, NULL, NULL, 48, NULL, 0.00, 0);

-- --------------------------------------------------------

--
-- Structure de la table `property_image`
--

CREATE TABLE `property_image` (
  `ImageId` int(11) NOT NULL,
  `PropertyId` int(11) NOT NULL,
  `ImageURL` varchar(255) NOT NULL,
  `Caption` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `property_image`
--

INSERT INTO `property_image` (`ImageId`, `PropertyId`, `ImageURL`, `Caption`) VALUES
(5, 5, '/uploads/property-1772555957141-588764095.png', 'Main Image'),
(6, 8, '/uploads/property-1773073676378-865829358.jpg', 'Main Image');

-- --------------------------------------------------------

--
-- Structure de la table `review`
--

CREATE TABLE `review` (
  `ReviewId` int(11) NOT NULL,
  `ReviewerId` int(11) NOT NULL,
  `ReviewedUserId` int(11) NOT NULL,
  `PropertyId` int(11) DEFAULT NULL,
  `BookingId` int(11) DEFAULT NULL,
  `Rating` int(11) NOT NULL CHECK (`Rating` >= 1 and `Rating` <= 5),
  `Comment` text DEFAULT NULL,
  `ReviewDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ReviewerType` enum('Renter','Owner') NOT NULL,
  `ReviewedRole` enum('Renter','Owner','Property') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `review`
--

INSERT INTO `review` (`ReviewId`, `ReviewerId`, `ReviewedUserId`, `PropertyId`, `BookingId`, `Rating`, `Comment`, `ReviewDate`, `ReviewerType`, `ReviewedRole`) VALUES
(1, 1, 2, 5, 7, 4, 'a nice hose thank you', '2026-03-05 19:36:09', 'Renter', 'Property'),
(2, 1, 2, 5, 4, 5, 'a nice man', '2026-03-05 19:36:51', 'Renter', 'Owner'),
(3, 2, 1, 5, 7, 4, 'we wish see next time :)', '2026-03-06 09:08:58', 'Owner', 'Renter');

-- --------------------------------------------------------

--
-- Structure de la table `user_a`
--

CREATE TABLE `user_a` (
  `UserId` int(11) NOT NULL,
  `FirstName` varchar(100) NOT NULL,
  `LastName` varchar(100) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `IDCardNumber` varchar(50) DEFAULT NULL,
  `Password` varchar(300) NOT NULL,
  `UserType` enum('Owner','Renter') NOT NULL,
  `IDCardFrontPath` varchar(500) DEFAULT NULL,
  `AverageRating` decimal(3,2) DEFAULT 0.00,
  `TotalReviews` int(11) DEFAULT 0,
  `ProfilePicturePath` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `user_a`
--

INSERT INTO `user_a` (`UserId`, `FirstName`, `LastName`, `Email`, `PhoneNumber`, `IDCardNumber`, `Password`, `UserType`, `IDCardFrontPath`, `AverageRating`, `TotalReviews`, `ProfilePicturePath`) VALUES
(1, 'Tarek', 'Ferhi', 'ferhi.tarek@yahoo.com', '0699787702', '100050841032670003', '$2b$10$vZ/SgM/cuSV3HFVmSQBIA.Jq4Aqrps5jXgsj5bqOf08R2nCwH0OOS', 'Renter', NULL, 4.00, 1, NULL),
(2, 'test', 'tttt', 'test@yahoo.com', '0794807081', '100001112765903847', '$2b$10$eX0C9Ko8lVwbpQm58luaT.8ZZXYCc5pJa37yFvGtW3YvWxp9YNRje', 'Owner', NULL, 4.50, 2, NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`AdminId`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `UserId` (`UserId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `advertpackage`
--
ALTER TABLE `advertpackage`
  ADD PRIMARY KEY (`PackageId`);

--
-- Index pour la table `benefits_from`
--
ALTER TABLE `benefits_from`
  ADD PRIMARY KEY (`PromotionId`),
  ADD KEY `BookingId` (`BookingId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`BookingId`),
  ADD KEY `UserId` (`UserId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `conversation`
--
ALTER TABLE `conversation`
  ADD PRIMARY KEY (`ConversationId`),
  ADD UNIQUE KEY `unique_conversation` (`RenterId`,`OwnerId`,`PropertyId`),
  ADD KEY `OwnerId` (`OwnerId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `feature`
--
ALTER TABLE `feature`
  ADD PRIMARY KEY (`FeatureId`);

--
-- Index pour la table `has_features`
--
ALTER TABLE `has_features`
  ADD PRIMARY KEY (`PropertyId`,`FeatureId`),
  ADD KEY `FeatureId` (`FeatureId`);

--
-- Index pour la table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`MessageId`),
  ADD KEY `SenderId` (`SenderId`),
  ADD KEY `ReceiverId` (`ReceiverId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`PaymentId`),
  ADD KEY `BookingId` (`BookingId`);

--
-- Index pour la table `payment_history`
--
ALTER TABLE `payment_history`
  ADD PRIMARY KEY (`PaymentId`);

--
-- Index pour la table `payment_transaction`
--
ALTER TABLE `payment_transaction`
  ADD PRIMARY KEY (`TransactionId`),
  ADD KEY `PropertyId` (`PropertyId`),
  ADD KEY `OwnerId` (`OwnerId`),
  ADD KEY `PackageId` (`PackageId`);

--
-- Index pour la table `promotion`
--
ALTER TABLE `promotion`
  ADD PRIMARY KEY (`PromotionId`);

--
-- Index pour la table `property`
--
ALTER TABLE `property`
  ADD PRIMARY KEY (`PropertyId`),
  ADD KEY `OwnerId` (`OwnerId`);

--
-- Index pour la table `property_image`
--
ALTER TABLE `property_image`
  ADD PRIMARY KEY (`ImageId`),
  ADD KEY `PropertyId` (`PropertyId`);

--
-- Index pour la table `review`
--
ALTER TABLE `review`
  ADD PRIMARY KEY (`ReviewId`),
  ADD UNIQUE KEY `unique_review` (`ReviewerId`,`BookingId`,`ReviewedUserId`),
  ADD KEY `ReviewedUserId` (`ReviewedUserId`),
  ADD KEY `PropertyId` (`PropertyId`),
  ADD KEY `BookingId` (`BookingId`);

--
-- Index pour la table `user_a`
--
ALTER TABLE `user_a`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD UNIQUE KEY `IDCardNumber` (`IDCardNumber`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `admin`
--
ALTER TABLE `admin`
  MODIFY `AdminId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `advertpackage`
--
ALTER TABLE `advertpackage`
  MODIFY `PackageId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `booking`
--
ALTER TABLE `booking`
  MODIFY `BookingId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `conversation`
--
ALTER TABLE `conversation`
  MODIFY `ConversationId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `feature`
--
ALTER TABLE `feature`
  MODIFY `FeatureId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `message`
--
ALTER TABLE `message`
  MODIFY `MessageId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `payment`
--
ALTER TABLE `payment`
  MODIFY `PaymentId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `payment_history`
--
ALTER TABLE `payment_history`
  MODIFY `PaymentId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `payment_transaction`
--
ALTER TABLE `payment_transaction`
  MODIFY `TransactionId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT pour la table `promotion`
--
ALTER TABLE `promotion`
  MODIFY `PromotionId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `property`
--
ALTER TABLE `property`
  MODIFY `PropertyId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `property_image`
--
ALTER TABLE `property_image`
  MODIFY `ImageId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `review`
--
ALTER TABLE `review`
  MODIFY `ReviewId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `user_a`
--
ALTER TABLE `user_a`
  MODIFY `UserId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `admin_ibfk_2` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`);

--
-- Contraintes pour la table `benefits_from`
--
ALTER TABLE `benefits_from`
  ADD CONSTRAINT `benefits_from_ibfk_1` FOREIGN KEY (`PromotionId`) REFERENCES `promotion` (`PromotionId`) ON DELETE CASCADE,
  ADD CONSTRAINT `benefits_from_ibfk_2` FOREIGN KEY (`BookingId`) REFERENCES `booking` (`BookingId`) ON DELETE CASCADE,
  ADD CONSTRAINT `benefits_from_ibfk_3` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`) ON DELETE CASCADE;

--
-- Contraintes pour la table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `booking_ibfk_2` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`);

--
-- Contraintes pour la table `conversation`
--
ALTER TABLE `conversation`
  ADD CONSTRAINT `conversation_ibfk_1` FOREIGN KEY (`RenterId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `conversation_ibfk_2` FOREIGN KEY (`OwnerId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `conversation_ibfk_3` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`);

--
-- Contraintes pour la table `has_features`
--
ALTER TABLE `has_features`
  ADD CONSTRAINT `has_features_ibfk_1` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`),
  ADD CONSTRAINT `has_features_ibfk_2` FOREIGN KEY (`FeatureId`) REFERENCES `feature` (`FeatureId`);

--
-- Contraintes pour la table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `message_ibfk_1` FOREIGN KEY (`SenderId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `message_ibfk_2` FOREIGN KEY (`ReceiverId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `message_ibfk_3` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`);

--
-- Contraintes pour la table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`BookingId`) REFERENCES `booking` (`BookingId`);

--
-- Contraintes pour la table `payment_transaction`
--
ALTER TABLE `payment_transaction`
  ADD CONSTRAINT `payment_transaction_ibfk_1` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`),
  ADD CONSTRAINT `payment_transaction_ibfk_2` FOREIGN KEY (`OwnerId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `payment_transaction_ibfk_3` FOREIGN KEY (`PackageId`) REFERENCES `advertpackage` (`PackageId`);

--
-- Contraintes pour la table `property`
--
ALTER TABLE `property`
  ADD CONSTRAINT `property_ibfk_1` FOREIGN KEY (`OwnerId`) REFERENCES `user_a` (`UserId`);

--
-- Contraintes pour la table `property_image`
--
ALTER TABLE `property_image`
  ADD CONSTRAINT `property_image_ibfk_1` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`);

--
-- Contraintes pour la table `review`
--
ALTER TABLE `review`
  ADD CONSTRAINT `review_ibfk_1` FOREIGN KEY (`ReviewerId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `review_ibfk_2` FOREIGN KEY (`ReviewedUserId`) REFERENCES `user_a` (`UserId`),
  ADD CONSTRAINT `review_ibfk_3` FOREIGN KEY (`PropertyId`) REFERENCES `property` (`PropertyId`),
  ADD CONSTRAINT `review_ibfk_4` FOREIGN KEY (`BookingId`) REFERENCES `booking` (`BookingId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
