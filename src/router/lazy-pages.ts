import { lazy } from 'react';

// 主 Tab 页面
export const HomeEntry = lazy(() => import('@/pages/cms/Home'));
export const MarketEntry = lazy(() => import('@/pages/market/Market'));
export const RightsEntry = lazy(() => import('@/pages/wallet/ClaimStation'));
export const ProfileEntry = lazy(() => import('@/pages/user/Profile'));
export const LivePage = lazy(() => import('@/pages/live/LivePage'));

// 认证页面
export const Login = lazy(() => import('@/pages/auth/Login'));
export const Register = lazy(() => import('@/pages/auth/Register'));
export const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
export const ResetLoginPassword = lazy(() => import('@/pages/auth/ResetLoginPassword'));
export const ResetPayPassword = lazy(() => import('@/pages/auth/ResetPayPassword'));

// 用户页面
export const Settings = lazy(() => import('@/pages/user/Settings'));
export const EditProfile = lazy(() => import('@/pages/user/EditProfile'));
export const AddressList = lazy(() => import('@/pages/user/AddressList'));
export const RealNameAuth = lazy(() => import('@/pages/user/RealNameAuth'));
export const AgentAuth = lazy(() => import('@/pages/user/AgentAuth'));
export const MyFriends = lazy(() => import('@/pages/user/MyFriends'));
export const FriendDetail = lazy(() => import('@/pages/user/FriendDetail'));
export const InviteFriends = lazy(() => import('@/pages/user/InviteFriends'));
export const AccountDeletion = lazy(() => import('@/pages/user/AccountDeletion'));
export const NotificationSettings = lazy(() => import('@/pages/user/NotificationSettings'));
export const UserSurvey = lazy(() => import('@/pages/user/UserSurvey'));
export const ActivityCenter = lazy(() => import('@/pages/user/ActivityCenter'));
export const TeamLeaderboard = lazy(() => import('@/pages/activity/team-leaderboard/TeamLeaderboardPage'));

// CMS/内容页面
export const News = lazy(() => import('@/pages/cms/News'));
export const AnnouncementDetail = lazy(() => import('@/pages/cms/AnnouncementDetail'));
export const MessageCenter = lazy(() => import('@/pages/cms/MessageCenter'));
export const SignIn = lazy(() => import('@/pages/cms/SignIn'));
export const HelpCenter = lazy(() => import('@/pages/cms/HelpCenter'));
export const OnlineService = lazy(() => import('@/pages/cms/OnlineService'));
export const AboutUs = lazy(() => import('@/pages/cms/AboutUs'));
export const PrivacyPolicy = lazy(() => import('@/pages/cms/PrivacyPolicy'));
export const UserAgreement = lazy(() => import('@/pages/cms/UserAgreement'));

// 市场/交易页面
export const ProductDetail = lazy(() => import('@/pages/market/ProductDetail'));
export const TradingZone = lazy(() => import('@/pages/market/TradingZone'));
export const MasterpieceShowcase = lazy(() => import('@/pages/market/MasterpieceShowcase'));
export const ReservationPage = lazy(() => import('@/pages/market/ReservationPage'));
export const ReservationRecordPage = lazy(() => import('@/pages/market/ReservationRecordPage'));
export const ReservationRecordDetailPage = lazy(() => import('@/pages/market/ReservationRecordDetailPage'));
export const SearchPage = lazy(() => import('@/pages/market/SearchPage'));
export const ReviewsPage = lazy(() => import('@/pages/market/ReviewsPage'));
export const SubmitReview = lazy(() => import('@/pages/market/SubmitReview'));
export const OrderListPage = lazy(() => import('@/pages/market/OrderListPage'));
export const OrderDetail = lazy(() => import('@/pages/market/OrderDetail'));
export const CollectionOrderDetail = lazy(() => import('@/pages/market/CollectionOrderDetail'));
export const Cashier = lazy(() => import('@/pages/market/Cashier'));

// 钱包/资产页面
export const AssetView = lazy(() => import('@/pages/wallet/AssetView'));
export const AssetHistory = lazy(() => import('@/pages/wallet/AssetHistory'));
export const BalanceRecharge = lazy(() => import('@/pages/wallet/BalanceRecharge'));
export const BalanceWithdraw = lazy(() => import('@/pages/wallet/BalanceWithdraw'));
export const RechargeOrderDetail = lazy(() => import('@/pages/wallet/RechargeOrderDetail'));
export const WithdrawOrderDetail = lazy(() => import('@/pages/wallet/WithdrawOrderDetail'));
export const ServiceRecharge = lazy(() => import('@/pages/wallet/ServiceRecharge'));
export const ExtensionWithdraw = lazy(() => import('@/pages/wallet/ExtensionWithdraw'));
export const CardManagement = lazy(() => import('@/pages/wallet/CardManagement'));
export const ConsignmentVoucher = lazy(() => import('@/pages/wallet/ConsignmentVoucher'));
export const CumulativeRights = lazy(() => import('@/pages/wallet/CumulativeRights'));
export const MyCollection = lazy(() => import('@/pages/wallet/MyCollection'));
export const MyCollectionDetail = lazy(() => import('@/pages/wallet/MyCollectionDetail'));
export const ClaimHistory = lazy(() => import('@/pages/wallet/ClaimHistory'));
export const ClaimDetail = lazy(() => import('@/pages/wallet/ClaimDetail'));
export const HashrateExchange = lazy(() => import('@/pages/wallet/HashrateExchange'));
export const MoneyLogDetail = lazy(() => import('@/pages/wallet/MoneyLogDetail'));
export const OrderFundDetail = lazy(() => import('@/pages/wallet/OrderFundDetail'));
export const RechargeOrderList = lazy(() => import('@/pages/wallet/RechargeOrderList'));
export const WithdrawOrderList = lazy(() => import('@/pages/wallet/WithdrawOrderList'));
