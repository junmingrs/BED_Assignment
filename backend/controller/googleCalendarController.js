const { oauth2Client } = require("../googleAuth");
const { google } = require("googleapis");
const googleTokenModel = require("../model/googleTokenModel");

// GET /auth/google?vendorId=xxx
// Redirects the vendor to Google's consent screen
const connectGoogle = (req, res) => {
    const { vendorId } = req.query;

    if (!vendorId) {
        return res.status(400).json({ error: "Missing vendorId" });
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline", // needed to get a refresh_token
        prompt: "consent", // forces refresh_token to be returned even on repeat connects
        scope: ["https://www.googleapis.com/auth/calendar.readonly"],
        state: vendorId, // carried through to the callback so we know which vendor this is for
    });

    res.redirect(authUrl);
};

// GET /auth/google/callback?code=...&state=vendorId
const googleCallback = async (req, res) => {
    const { code, state: vendorId } = req.query;

    if (!code || !vendorId) {
        return res.status(400).send("Missing code or vendor reference.");
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        await googleTokenModel.saveTokens(vendorId, tokens);

        // redirect back to the vendor calendar page after successful connect
        res.redirect("/vendor/calendar.html?connected=true");
    } catch (err) {
        console.error("Error exchanging Google auth code:", err);
        res.redirect("/vendor/calendar.html?connected=false");
    }
};

// GET /vendor/calendar/status - check if this vendor has connected Google Calendar
const getConnectionStatus = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const tokens = await googleTokenModel.getTokens(vendorId);
        res.status(200).json({ connected: Boolean(tokens) });
    } catch (err) {
        console.error("Error checking Google connection status:", err);
        res.status(500).json({ error: err.message });
    }
};

// GET /vendor/calendar/events - fetch this vendor's synced Google Calendar events
const getGoogleEvents = async (req, res) => {
    try {
        const vendorId = req.user.id;
        const storedTokens = await googleTokenModel.getTokens(vendorId);

        if (!storedTokens) {
            return res
                .status(404)
                .json({ error: "Google Calendar not connected" });
        }

        // set up a per-request client with this vendor's tokens
        const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI,
        );

        client.setCredentials({
            access_token: storedTokens.access_token,
            refresh_token: storedTokens.refresh_token,
            expiry_date: storedTokens.token_expiry
                ? new Date(storedTokens.token_expiry).getTime()
                : null,
        });

        // auto-persist refreshed tokens if Google issues new ones during this call
        client.on("tokens", async (newTokens) => {
            await googleTokenModel.saveTokens(vendorId, {
                access_token:
                    newTokens.access_token ?? storedTokens.access_token,
                refresh_token:
                    newTokens.refresh_token ?? storedTokens.refresh_token,
                expiry_date: newTokens.expiry_date ?? storedTokens.token_expiry,
            });
        });

        const calendar = google.calendar({ version: "v3", auth: client });

        // get every calendar this account has access to (not just "primary")
        const calendarListResponse = await calendar.calendarList.list();
        const calendarIds = (calendarListResponse.data.items || []).map(
            (cal) => cal.id,
        );

        // fetch events from each calendar in parallel, then merge
        const eventsPerCalendar = await Promise.all(
            calendarIds.map((calendarId) =>
                calendar.events
                    .list({
                        calendarId,
                        timeMin: new Date().toISOString(),
                        maxResults: 50,
                        singleEvents: true,
                        orderBy: "startTime",
                    })
                    .then((res) => res.data.items || [])
                    .catch((err) => {
                        console.error(
                            `Failed to fetch events for calendar ${calendarId}:`,
                            err.message,
                        );
                        return []; // skip calendars that fail (e.g. no access) rather than failing the whole request
                    }),
            ),
        );

        const events = eventsPerCalendar
            .flat()
            .map((event) => ({
                id: event.id,
                title: event.summary || "(No title)",
                start: event.start?.dateTime || event.start?.date,
                end: event.end?.dateTime || event.end?.date,
                description: event.description || "",
                source: "google",
            }))
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        res.status(200).json(events);
    } catch (err) {
        console.error("Error fetching Google Calendar events:", err);
        res.status(500).json({
            error: "Failed to fetch Google Calendar events",
        });
    }
};

// DELETE /vendor/calendar/disconnect
const disconnectGoogle = async (req, res) => {
    try {
        const vendorId = req.user.id;
        await googleTokenModel.deleteTokens(vendorId);
        res.status(200).json({ message: "Google Calendar disconnected" });
    } catch (err) {
        console.error("Error disconnecting Google Calendar:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    connectGoogle,
    googleCallback,
    getConnectionStatus,
    getGoogleEvents,
    disconnectGoogle,
};
