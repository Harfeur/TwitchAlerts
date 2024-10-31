--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8 (Debian 15.8-1.pgdg120+1)
-- Dumped by pg_dump version 15.8 (Debian 15.8-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: twitchalerts
--

CREATE TABLE public.alerts (
    guild_id bigint NOT NULL,
    streamer_id bigint NOT NULL,
    alert_channel bigint NOT NULL,
    alert_message bigint,
    alert_start text NOT NULL,
    alert_end text NOT NULL,
    alert_pref_display_game boolean DEFAULT true NOT NULL,
    alert_pref_display_viewers boolean DEFAULT true NOT NULL
);


ALTER TABLE public.alerts OWNER TO twitchalerts;

--
-- Name: guilds; Type: TABLE; Schema: public; Owner: twitchalerts
--

CREATE TABLE public.guilds (
    guild_id bigint NOT NULL,
    guild_language character varying(10) DEFAULT 'default'::character varying NOT NULL
);


ALTER TABLE public.guilds OWNER TO twitchalerts;

--
-- Name: streamers; Type: TABLE; Schema: public; Owner: twitchalerts
--

CREATE TABLE public.streamers (
    streamer_id bigint NOT NULL,
    streamer_live boolean DEFAULT false NOT NULL
);


ALTER TABLE public.streamers OWNER TO twitchalerts;

--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: twitchalerts
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (guild_id, streamer_id);


--
-- Name: guilds guilds_pkey; Type: CONSTRAINT; Schema: public; Owner: twitchalerts
--

ALTER TABLE ONLY public.guilds
    ADD CONSTRAINT guilds_pkey PRIMARY KEY (guild_id);


--
-- Name: streamers streamers_pkey; Type: CONSTRAINT; Schema: public; Owner: twitchalerts
--

ALTER TABLE ONLY public.streamers
    ADD CONSTRAINT streamers_pkey PRIMARY KEY (streamer_id);


--
-- Name: alerts alerts_guild_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: twitchalerts
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_guild_id_fkey FOREIGN KEY (guild_id) REFERENCES public.guilds(guild_id);


--
-- Name: alerts alerts_streamer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: twitchalerts
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_streamer_id_fkey FOREIGN KEY (streamer_id) REFERENCES public.streamers(streamer_id);


--
-- PostgreSQL database dump complete
--

