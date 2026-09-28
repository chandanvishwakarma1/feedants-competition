import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Linking, Share } from 'react-native';
import { colors } from '../theme/colors';
import { Megaphone, Play, ShieldCheck } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';



export default function PostDisclaimerSection({ competition }) {
    const { referral, howPrizeMoneyVideoUrl, refundPolicyUrl } = competition;
    const referralLink = referral?.link ?? "";
    const openUrl = (url) => url && Linking.openURL(url);
    const shareLink = () => referralLink && Share.share({ message: `Join me on Feedants: ${referralLink}` });
    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(referralLink);
        Alert.alert('Link Copied!');
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <TouchableOpacity style={[styles.card, styles.halfCard, { gap: 6 }]} onPress={() => openUrl(howPrizeMoneyVideoUrl)}>
                    <View style={{ backgroundColor: colors.border, padding: 8, borderRadius: 100, alignSelf: "flex-start" }}>
                        <Play size={16} fill={colors.primary} strokeWidth={0} />
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>How will you receive prize money?</Text>
                        <Text style={styles.cardSubtitle}>Watch video to know more</Text>
                    </View>
                </TouchableOpacity>

                <View style={[styles.card, styles.halfCard, styles.policiesCard]}>
                    <TouchableOpacity style={styles.policyRow} onPress={() => openUrl(refundPolicyUrl)}>
                        <ShieldCheck color={colors.success} />
                        <Text style={styles.policyText}>Refund policy</Text>
                    </TouchableOpacity>
                    <View style={styles.policyRow}>
                        <ShieldCheck color={colors.success} />
                        <Text style={styles.policyText}>Secure payments</Text>
                    </View>
                    <Image source={{ uri: 'https://badges.razorpay.com/badge-light.png' }} style={{ width: 112, height: 45 }} resizeMode='contain' />
                </View>
            </View>

            <View style={styles.referCard}>
                <View style={styles.referHeaderRow}>
                    <View style={styles.speakerIconContainer}>
                        <Megaphone />
                    </View>
                    <View style={styles.referTextContainer}>
                        <Text style={styles.referTitle}>Refer & Earn more discount</Text>
                    </View>
                    <TouchableOpacity style={styles.referButton} onPress={shareLink}>
                        <Text style={styles.referButtonText}>Refer Now</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.linkAndNoteRow}>
                    <View style={styles.linkContainer}>
                        <Text style={styles.linkText} numberOfLines={1}>
                            {referralLink}
                        </Text>
                        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                            <Text style={styles.copyButtonText}>Copy Link</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.earningNote}>
                        You earn <Text style={styles.boldNote}>₹{referral?.rewardPerSignup ?? 0}</Text> for every signup
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={styles.feedbackRow}>
                <View style={styles.feedbackLeft}>
                    <Text style={styles.chatIcon}>💬</Text>
                    <View style={styles.feedbackTextContainer}>
                        <Text style={styles.feedbackTitle}>Hear From Our Users</Text>
                        <Text style={styles.feedbackSubtitle}>See what participants say about Feedants</Text>
                    </View>
                </View>
                <Text style={styles.arrowIcon}>❯</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingVertical: 12, backgroundColor: '#F8FAFC', gap: 12 },
    row: { flexDirection: 'row', gap: 12 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    halfCard: { flex: 1, minHeight: 90 },
    cardContent: { flex: 1, gap: 2 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: '#1E293B', lineHeight: 16, width: '100%' },
    cardSubtitle: { fontSize: 10, color: '#64748B' },
    policiesCard: { justifyContent: 'center', gap: 6 },
    policyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    policyText: { fontSize: 11, fontWeight: '500', color: '#1E293B' },

    referCard: { backgroundColor: '#E6F7F0', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#C2EDDA', gap: 12 },
    referHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    speakerIconContainer: { width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    referTextContainer: { flex: 1 },
    referTitle: { fontSize: 13, fontWeight: '700', color: '#0F291E' },
    referButton: { backgroundColor: '#007A64', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 6 },
    referButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    linkAndNoteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    linkContainer: {
        flex: 0.65, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingLeft: 8, height: 32, overflow: 'hidden',
    },
    linkText: { flex: 1, fontSize: 10, color: '#64748B' },
    copyButton: {
        backgroundColor: '#F1F5F9', height: '100%', paddingHorizontal: 8, justifyContent: 'center',
        borderLeftWidth: 1, borderLeftColor: '#CBD5E1',
    },
    copyButtonText: { fontSize: 10, fontWeight: '600', color: '#334155' },
    earningNote: { flex: 0.35, fontSize: 10, color: '#007A64', textAlign: 'right' },
    boldNote: { fontWeight: '700' },

    feedbackRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
        borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4,
    },
    feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    chatIcon: { fontSize: 16, color: '#64748B' },
    feedbackTextContainer: { gap: 2 },
    feedbackTitle: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
    feedbackSubtitle: { fontSize: 10, color: '#64748B' },
    arrowIcon: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
});