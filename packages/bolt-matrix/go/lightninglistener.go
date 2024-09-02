package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/net/context"
	"maunium.net/go/mautrix"
	"maunium.net/go/mautrix/appservice"
	"maunium.net/go/mautrix/event"
	"maunium.net/go/mautrix/id"
)

type LightningSendBody struct {
	RoomId   string                      `json:"room_id"`
	Intent   string                      `json:"intent"`
	Messages []event.MessageEventContent `json:"messages"`
}

type LightningDeleteBody struct {
	RoomId   string   `json:"room_id"`
	Messages []string `json:"messages"`
}

type LightningProvisionBody struct {
	UserId      string `json:"mxid"`
	DisplayName string `json:"display_name"`
	AvatarMXC   string `json:"avatar_mxc"`
}

func LightningListener(appsvc *appservice.AppService) {
	appsvc.Router.HandleFunc("/_lightning/upload", func(w http.ResponseWriter, r *http.Request) {
		// the request has a blob of data in it
		if r.Method == "POST" {
			file, header, err := r.FormFile("file")

			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte("bad request"))
			}

			defer file.Close()

			resp, err := appsvc.BotIntent().UploadMedia(context.Background(), mautrix.ReqUploadMedia{
				Content:       file,
				ContentLength: header.Size,
				ContentType:   header.Header.Get("Content-Type"),
				FileName:      header.Filename,
			})

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(err)
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(resp.ContentURI.String()))
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("that method is not allowed"))
		}
	})

	appsvc.Router.HandleFunc("/_lightning/provision", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			var packet LightningProvisionBody

			err := json.NewDecoder(r.Body).Decode(&packet)

			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte("bad request"))
			}

			intent := appsvc.Intent(id.UserID(packet.UserId))
			ctx := context.Background()
			err = intent.SetDisplayName(ctx, packet.DisplayName)

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(err)
			}

			err = intent.SetAvatarURL(ctx, id.MustParseContentURI(packet.AvatarMXC))

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(err)
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(packet)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("that method is not allowed"))
		}
	})

	appsvc.Router.HandleFunc("/_lightning/profile", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			user_id := r.URL.Query().Get("mxid")
			intent := appsvc.BotIntent()
			ctx := context.Background()
			user, err := intent.GetProfile(ctx, id.UserID(user_id))

			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(err)
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(user)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("that method is not allowed"))
		}
	})

	appsvc.Router.HandleFunc("/_lightning/messages", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			var packet LightningSendBody

			err := json.NewDecoder(r.Body).Decode(&packet)

			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte("bad request"))
			}

			user_id := id.UserID(packet.Intent)
			intent := appsvc.Intent(user_id)
			ctx := context.Background()
			event_ids := make([]string, 0)

			for _, message := range packet.Messages {
				result, err := intent.SendMessageEvent(ctx, id.RoomID(packet.RoomId), event.EventMessage, message)

				if err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(err)
				}

				event_ids = append(event_ids, result.EventID.String())
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(event_ids)
		} else if r.Method == "DELETE" {
			var packet LightningDeleteBody

			err := json.NewDecoder(r.Body).Decode(&packet)

			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte("bad request"))
			}

			intent := appsvc.BotIntent()
			ctx := context.Background()

			for _, msg_id := range packet.Messages {
				_, err := intent.RedactEvent(ctx, id.RoomID(packet.RoomId), id.EventID(msg_id))

				if err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(err)
				}
			}

			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(packet.Messages)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
			w.Write([]byte("that method is not allowed"))
		}
	})
}
