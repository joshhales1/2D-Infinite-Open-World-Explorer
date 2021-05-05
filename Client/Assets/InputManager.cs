using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InputManager : MonoBehaviour
{
    Networking network;

    private Dictionary<string, bool> keysPressed = new Dictionary<string, bool>();

    private Dictionary<string, string> inputMap = new Dictionary<string, string>() {
        { "w", "1"},
        { "d", "2"},
        { "s", "3"},
        { "a", "4"},
    };

    // Start is called before the first frame update
    void Start()
    {
        network = GetComponent<Networking>();
    }

    private void UpdateKeys(string key, bool down)
    {
        if (keysPressed.ContainsKey(key))
            keysPressed[key] = down;
        else
            keysPressed.Add(key, down);

        bool shouldZero = true;
        string prio = "";
        foreach (KeyValuePair<string, bool> kv in keysPressed)
        {
            if (kv.Value)
            {
                prio = inputMap[kv.Key];
                shouldZero = false;
                break;
            }              

        }

        if (shouldZero)
        {
            SendInput("mv", "0");
        } else
        {
            SendInput("mv", prio);
        }

    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown("w"))
            UpdateKeys("w", true);
        if (Input.GetKeyDown("a"))
            UpdateKeys("a", true);
        if (Input.GetKeyDown("s"))
            UpdateKeys("s", true);
        if (Input.GetKeyDown("d"))
            UpdateKeys("d", true);


        if (Input.GetKeyUp("w"))
            UpdateKeys("w", false);
        if (Input.GetKeyUp("a"))
            UpdateKeys("a", false);
        if (Input.GetKeyUp("s"))
            UpdateKeys("s", false);
        if (Input.GetKeyUp("d"))
            UpdateKeys("d", false);

        if (Input.GetMouseButtonDown(1))
            SendInput("place", "true", "isPlacing");
        if (Input.GetMouseButtonUp(1))
            SendInput("place", "false", "isPlacing");

        if (Input.GetMouseButtonDown(0))
            SendInput("break", "true", "isBreaking");
        if (Input.GetMouseButtonUp(0))
            SendInput("break", "false", "isBreaking");

        if (Input.GetKeyDown("q"))
            SendInput("attack", "true", "isAttacking");
        if (Input.GetKeyDown("q"))
            SendInput("attack", "false", "isAttacking");


    }

    private void SendInput(string type, string value, string customDataName = "data")
    {
        network.Send(
                new Message()
                {
                    head = type,
                    values = new Dictionary<string, object>() {
                        { customDataName, value}
                    }
                }
                ); 
    }
}
