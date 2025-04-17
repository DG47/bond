import React from "react";
import { Box, Typography, Grid2, IconButton, Link as MuiLink } from "@mui/material";
import { LinkedIn, Email } from "@mui/icons-material";
import X from '@mui/icons-material/X';

const Footer = () => {
  return (
   <Box sx={{ bgcolor: "#6c5ce7", color: "#fff", px: { xs: 3, md: 10 }, py: 5 }}>
      <Grid2 container spacing={4}>
        {/* Logo & Navigation */}
        <Grid2 item xs={12} md={12}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 4
            }}
          >
            <Box sx={{ mb: 2, minWidth: 200 }}>
              <img
                src="/logo.png"
                alt="Sparx Logo"
                style={{ height: 40, objectFit: "contain" }}
              />
            </Box>

            {/* Product */}
            <Box sx={{ mr: 6 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Product</Typography>
              {['mssp', 'reach', 'kcc'].map((item) => (
                <MuiLink
                  key={item}
                  href={`https://usesparx.com/${item}/`}
                  underline="hover"
                  rel="noopener noreferrer"
                  target="_blank"
                  sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
                >
                  {item.toUpperCase()}
                </MuiLink>
              ))}
            </Box>

            {/* Legal */}
            <Box sx={{ mx: 6 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Legal</Typography>
              <MuiLink
                href="https://docs.usesparx.com/sparx-documentation/legal/privacy-policy"
                underline="hover"
                rel="noopener noreferrer"
                target="_blank"
                sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
              >
                Privacy Policy
              </MuiLink>
              <MuiLink
                href="https://docs.usesparx.com/sparx-documentation/legal/terms-of-service"
                underline="hover"
                rel="noopener noreferrer"
                target="_blank"
                sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
              >
                Terms of Service
              </MuiLink>
            </Box>

            {/* Resources */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Resources</Typography>
              <MuiLink
                href="https://www.forbes.com/profile/sparx/"
                underline="hover"
                rel="noopener noreferrer"
                target="_blank"
                sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
              >
                Press
              </MuiLink>
              <MuiLink
                href="https://usesparx.com/"
                underline="hover"
                rel="noopener noreferrer"
                target="_blank"
                sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
              >
                About Us
              </MuiLink>
              <MuiLink
                href="https://app.dover.com/jobs/sparx"
                underline="hover"
                rel="noopener noreferrer"
                target="_blank"
                sx={{ color: 'inherit', fontWeight: 500, display: 'block' }}
              >
                Careers
              </MuiLink>
            </Box>
          </Box>
        </Grid2>

        {/* License and Social Icons */}
        <Grid2 item xs={12} md={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              mt: 4
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                component="a"
                fontSize="large"
                href="https://www.linkedin.com/company/usesparx/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "white" }}
              >
                <LinkedIn />
              </IconButton>
              <IconButton
                component="a"
                fontSize="large"
                href="https://x.com/usesparx/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "white" }}
              >
                <X />
              </IconButton>
              <IconButton
                component="a"
                fontSize="large"
                href="mailto:team@usersparx.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "white" }}
              >
                <Email />
              </IconButton>
            </Box>

            <Typography variant="body2" sx={{ textAlign: 'left', maxWidth: 800 }}>
             <h3> <strong>Licenses</strong> </h3>
              Sparx Insurance Services LLC is licensed to sell insurance products in all 50 states, the District of
              Columbia, and Puerto Rico. <br/>
              NPN No. 20543884.
            </Typography>
          </Box>
        </Grid2>

        {/* Disclaimer Section */}
        <Grid2 item xs={12}>
          <Typography
            variant="caption"
            component="div"
            sx={{ mt: 4, lineHeight: 1.6, textAlign: 'justify', hyphens: 'auto', wordBreak: 'break-word' }}
          >
            Risk Score and Forecasting Disclaimer: The risk score provided by the Sparx platform is an
  actuarial-based projection intended to estimate the likelihood that an Accountable Care Organization (ACO)
  will achieve shared savings. This score is derived using historical Medicare FFS Claims Data, publicly
  available benchmark reports, financial statements, and proprietary actuarial models. However, these projections are
  forward-looking estimates that are subject to numerous factors beyond Sparx’s control, including but not limited to:
  Changes in regulatory frameworks and Medicare reimbursement policies; Variability in provider network performance and
  turnover; Economic and market conditions that affect healthcare costs; Data inaccuracies or delays in financial
  reporting.<br/><br/>

  No Guarantee of Accuracy: Sparx makes no guarantee, representation, or warranty that the
  risk score, savings probability, or any related forecast will accurately predict future financial or
  operational performance. Users must not rely solely on these projections when making financial, business,
  or underwriting decisions.<br/><br/>

  Limitation of Liability: Sparx offers actuarial insights and benchmarking tools as
  informational resources to support decision-making. The risk score is intended to provide guidance but
  does not constitute an underwriting decision, nor should it be interpreted as financial, investment, or
  legal advice. While Sparx has been granted certain binding authority in some cases, it does not have the
  final decision-making authority regarding bond issuance. The ultimate decision to issue a bond,
  including setting final terms, conditions, and requirements, is made solely by the surety carrier.
  Sparx evaluates risks and provides underwriting assessments using analytical tools, but such
  assessments are advisory in nature and do not guarantee approval, issuance, or specific terms of any bond.
  Nothing in Sparx's role or risk assessment should be construed as creating an obligation, express or
  implied, to approve or issue a bond. While Sparx endeavors to provide accurate and meaningful data, it
  cannot guarantee specific outcomes. Users are encouraged to consider multiple factors when evaluating
  risk projections. Sparx is not liable for financial losses, regulatory matters and penalties, or business
  disruptions arising from reliance on its risk analytics or projections. Users acknowledge that decisions
  based on Sparx's tools and reports are made at their own discretion. To the fullest extent permitted by
  law, Sparx disclaims all liability for direct, indirect, incidental, consequential, or special damages
  arising from the use of its risk score, analytics, or financial forecasts.<br/><br/>

  No Fiduciary or Advisory Relationship: Sparx is not a financial, legal,
  or investment advisor. The information provided through the platform does not constitute: Investment
  advice, Actuarial underwriting, Legal compliance guidance, Financial guarantees. Users are strongly
  encouraged to conduct independent due diligence or seek professional advisory services before making
  financial or business decisions. <br/><br/>

  Data and Benchmarking Accuracy Disclaimer: The data used in the Sparx platform,
  including but not limited to CMS Quarterly Benchmark Reports, audited financials, and interim financials,
  may be incomplete, delayed, or subject to updates. Sparx does not control third-party data sources and
  makes no representations about their completeness, accuracy, or timeliness. Users should verify all
  data points independently before relying on them for business or financial decisions.<br/><br/>

  Acknowledgment and Acceptance: By using the Sparx platform, you acknowledge that you
  have read, understood, and agreed to this disclaimer. You further agree that: The risk score is a
  predictive tool, not a definitive measure of financial success. Sparx bears no responsibility for
  underwriting outcomes or financial performance. You will not hold Sparx liable for any business, financial,
  or legal consequences resulting from reliance on platform outputs. This disclaimer is incorporated by
  reference into Sparx's Terms of Service. If you do not agree to these terms, you should discontinue use
  of the platform immediately. For questions or concerns, please contact{' '}<MuiLink
  href="mailto:legal@usesparx.com"
  underline="hover"
  sx={{ color: 'inherit', fontWeight: 500 }}
            >
              <strong>legal@usesparx.com</strong>
            </MuiLink>
          </Typography>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default Footer;
