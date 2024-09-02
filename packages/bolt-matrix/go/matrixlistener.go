package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"

	"maunium.net/go/mautrix/appservice"
	"maunium.net/go/mautrix/event"
)

type MatrixClientEvent struct {
	Content        map[string]interface{} `json:"content"`
	EventID        string                 `json:"event_id"`
	OriginServerTs int                    `json:"origin_server_ts"`
	RoomID         string                 `json:"room_id"`
	Sender         string                 `json:"sender"`
	StateKey       string                 `json:"state_key,omitempty"`
	Type           string                 `json:"type"`
}

func MatrixListener(appsvc *appservice.AppService, cfg MatrixConfig) {
	go func() {
		for ev := range appsvc.Events {
			go send_ev(*ev)

			if ev.Type == event.StateMember && ev.Content.AsMember().Membership == event.MembershipInvite {
				if ev.GetStateKey() == appsvc.BotIntent().UserID.String() {
					go appsvc.BotIntent().JoinRoomByID(context.Background(), ev.RoomID)
				}
			}
		}
	}()
}

func send_ev(ev event.Event) {
	client_event := MatrixClientEvent{
		Content:        ev.Content.Raw,
		EventID:        ev.ID.String(),
		OriginServerTs: int(ev.Timestamp),
		RoomID:         ev.RoomID.String(),
		Sender:         ev.Sender.String(),
		StateKey:       ev.GetStateKey(),
		Type:           ev.Type.String(),
	}

	body, err := json.Marshal(client_event)

	if err != nil {
		return
	}

	resp, err := http.Post("plugin_url", "application/json", bytes.NewBuffer(body))

	if err != nil {
		return
	}

	defer resp.Body.Close()
}
