using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using WebSocketSharp;

public class Networking : MonoBehaviour
{

    [SerializeField]
    private int serverPort;

    [SerializeField]
    private string ipAddress;
    private WebSocket webSocket;

    private GameManager gameManager;

    private void Start()
    {
        gameManager = GetComponent<GameManager>();

        webSocket = new WebSocket("ws://" + ipAddress + ":" + serverPort.ToString());
        
        webSocket.OnOpen += OnOpen;
        webSocket.OnMessage += OnMessage;
        webSocket.OnError += OnError;
        webSocket.OnClose += OnClose;
        webSocket.Connect();

        Send(new Message()
        {

            head = "user_token",
            values = new Dictionary<string, object>()
            {
                {"token", "random"}
            }
        });

    }

    private void OnOpen(object sender, EventArgs e)
    {
        Debug.Log("Connected!");
    }

    private void OnClose(object sender, CloseEventArgs e)
    {
        Debug.LogWarning(e.Reason);
    }

    private void OnMessage(object sender, MessageEventArgs e)
    { 
        gameManager.OnMessage(OpenMessage(e.Data));
    }

    private void OnError(object sender, ErrorEventArgs e)
    {
        Debug.LogError(e.Exception.ToString());
    }

    private static Message OpenMessage(string input)
    {
        Message message = new Message
        {
            values = new Dictionary<string, object>(),

            head = input.Split('&')[0]
        };

        foreach (string kv in input.Split('&')[1].Split('^'))
        {
            if (kv == "")
                continue;
            message.values.Add(kv.Split(':')[0], kv.Split(':')[1]);
        }
            
        return message;
    }

    private static string WriteMessage(Message message)
    {
        string output = message.head + "&";

        foreach (KeyValuePair<string, object> kv in message.values)
        {
            output += kv.Key + ":" + kv.Value.ToString() + "^";
        }

        return output;
    }

    public void Send(Message m)
    {
        webSocket.Send(WriteMessage(m));
    }
}

public struct Message
{
    public string head;
    public Dictionary<string, object> values;
}
