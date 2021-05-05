/*

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using WebSocketSharp;

class Chunk
{
    public Tile[,] tiles = new Tile[16, 16];

    public int x;
    public int y;

}

class Tile
{
    public int floor;
    public int block;
}

class Entity
{
    public int x;
    public int y;

    public bool alive;
}
/*
public class NetworkController : MonoBehaviour
{

    public Sprite[] sprites;
    public GameObject o;

    public Sprite water;

    public Sprite tree;

    public Sprite five;

    public string me;

    public GameObject entity;

    List<string> newChunks = new List<string>();
    List<string> newEntities = new List<string>();

    WebSocket ws;

    Dictionary<string, Chunk> chunks = new Dictionary<string, Chunk>();
    Dictionary<string, Entity> entities = new Dictionary<string, Entity>();

    Dictionary<string, GameObject> em = new Dictionary<string, GameObject>();

    private void OnApplicationQuit()
    {
        ws.Close();
    }

    // Start is called before the first frame update
    void Start()
    {


        KeyValuePair<string, object>[] pairs = {

        new KeyValuePair<string, object>("key1", 1),
        new KeyValuePair<string, object>("key2", "hi"),
        new KeyValuePair<string, object>("key3", "?")

        };


        Debug.Log("hello");

        ws = new WebSocket("ws://81.151.27.79:8080");



        ws.OnOpen += (sender, e) =>
        {
            Debug.Log("Connected");
            ws.Send(WriteMessage("user_token", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("x", "hello")}));
            Debug.Log("Sent a thing");

        };

        ws.OnMessage += (sender, e) =>
        {

            Debug.Log(e.Data);

            var message = ReadMessage(e.Data, out string h);
            if (h == "load_chunk")
            {
                Chunk c = new Chunk();

                message.TryGetValue("data", out object data);
                message.TryGetValue("key", out object key);
                string tilemap = data.ToString();

                var rows = tilemap.Split('/');

                c.x = int.Parse(key.ToString().Split(',')[0]);
                c.y = int.Parse(key.ToString().Split(',')[1]);

                for (int x = 0; x < 16; x++)
                {
                    for (int y = 0; y < 16; y++)
                    {
                        c.tiles[x, y] = new Tile();


                        c.tiles[x, y].floor = int.Parse(rows[x][2 * y + 1].ToString());
                        c.tiles[x, y].block = int.Parse(rows[x][2 * y].ToString());
                    }
                }

                if (chunks.ContainsKey(key.ToString()))
                {
                    chunks[key.ToString()] = c;
                } else
                {
                    chunks.Add(key.ToString(), c);
                }
                

                newChunks.Add(key.ToString());

                

            }

            if (h == "entity")
            {

                message.TryGetValue("ueid", out object ueid);

                if (!entities.ContainsKey(ueid.ToString()))
                {
                    entities.Add(ueid.ToString(), new Entity());
                    
                }

                entities[ueid.ToString()].x = int.Parse(message["x"].ToString());
                entities[ueid.ToString()].y = int.Parse(message["y"].ToString());

                entities[ueid.ToString()].alive = message["dead"].ToString() == "false";

                newEntities.Add(ueid.ToString());
            }

            if (h == "you")
            {
                me = message["ueid"].ToString();
            }
        };

        ws.OnError += (sender, e) =>
        {

            Debug.LogError(e.Exception.ToString());

        };

        ws.OnClose += (sender, e) =>
        {
            Debug.Log("Closed");
            Debug.Log(e.Code);
            Debug.Log(e.WasClean);

        };

        ws.Connect();

    }

    // Update is called once per frame
    void Update()
    {        

        if (me != null && em.ContainsKey(me))
        {
            if (Camera.main.transform.parent != em[me])
            {
                Camera.main.transform.parent = em[me].transform;
            }
        }
            //Camera.main.transform.position = new Vector3(em[me].transform.position.x, em[me].transform.position.y, Camera.main.transform.position.z);

        var clone = newChunks.ToArray();
        newChunks.Clear();
        foreach (string chunkKey in clone)
        {

            Debug.Log(chunkKey);

            Chunk nc;
            chunks.TryGetValue(chunkKey, out nc);

            var chunkCont = new GameObject();

            chunkCont.transform.position = new Vector3(nc.x * 16, nc.y * 16);

            for (int xx = 0; xx < 16; xx++)
                for (int yy = 0; yy < 16; yy++)
                {
                    var oo = Instantiate(o, chunkCont.transform, false);

                    if (nc.tiles[xx, yy].floor == 0)
                        continue;

                    oo.GetComponent<SpriteRenderer>().sprite = sprites[nc.tiles[xx, yy].floor - 1];
                    oo.transform.localPosition = new Vector3(xx, yy, -1);

                    

                    if (nc.tiles[xx, yy].block == 1)
                    {
                        var ooo = Instantiate(o, chunkCont.transform, false);
                        ooo.GetComponent<SpriteRenderer>().sprite = tree;
                        ooo.transform.localPosition = new Vector3(xx, yy, -4);
                        ooo.name = "tree";                    
                    }

                    if (nc.tiles[xx, yy].block == 3)
                    {
                        var ooo = Instantiate(o, chunkCont.transform, false);
                        ooo.GetComponent<SpriteRenderer>().sprite = water;
                        ooo.transform.localPosition = new Vector3(xx, yy, -4);
                        ooo.name = "water";
                    }

                    if (nc.tiles[xx, yy].block == 5)
                    {
                        var ooo = Instantiate(o, chunkCont.transform, false);
                        ooo.GetComponent<SpriteRenderer>().sprite = five;
                        ooo.transform.localPosition = new Vector3(xx, yy, -4);
                        ooo.name = "five";
                    }



                }
        }

        var eclone = newEntities.ToArray();

        newEntities.Clear();

        foreach (string ueid in eclone)
        {

            if (!em.ContainsKey(ueid))
            {
                var newe = Instantiate(entity);
                em.Add(ueid, newe);
            }
            em[ueid].transform.position = new Vector3(entities[ueid].x, entities[ueid].y, -2);

            if (!entities[ueid].alive)
            {
                Destroy(em[ueid]);
            }
            
        }

        if (Input.GetKeyDown("q"))
        {
            ws.Send(WriteMessage("place", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isPlacing", "true") }));

        }

        if (Input.GetKeyUp("q"))
        {
            ws.Send(WriteMessage("place", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isPlacing", "false") }));

        }

        if (Input.GetKeyDown("r"))
        {
            ws.Send(WriteMessage("attack", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isAttacking", "true") }));

        }

        if (Input.GetKeyUp("r"))
        {
            ws.Send(WriteMessage("attack", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isAttacking", "false") }));

        }

        if (Input.GetKeyDown("e"))
        {
            ws.Send(WriteMessage("break", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isBreaking", "true") }));

        }

        if (Input.GetKeyUp("e"))
        {
            ws.Send(WriteMessage("break", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("isBreaking", "false") }));

        }

        if (Input.GetKeyDown("w"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 1) }));

        }

        if (Input.GetKeyUp("w"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 0) }));

        }

        if (Input.GetKeyDown("a"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 4) }));

        }

        if (Input.GetKeyUp("a"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 0) }));

        }

        if (Input.GetKeyDown("s"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 3) }));

        }

        if (Input.GetKeyUp("s"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 0) }));

        }

        if (Input.GetKeyDown("d"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 2) }));

        }

        if (Input.GetKeyUp("d"))
        {
            ws.Send(WriteMessage("mv", new KeyValuePair<string, object>[] { new KeyValuePair<string, object>("data", 0) }));

        }

    }

    string WriteMessage(string head, KeyValuePair<string, object>[] keyValues)
    {
        string output = head + "&";

        foreach (KeyValuePair<string, object> keyValue in keyValues) 
            output += keyValue.Key + ":" + keyValue.Value + "^";

        return output;
    }

    Dictionary<string, object> ReadMessage(string input, out string head)
    {
        var outputObject = new Dictionary<string, object>();

        var split1 = input.Split('&');

        head = split1[0];

        var body = split1[1];

        var split2 = body.Split('^');

        foreach (string pair in split2)
        {
            if (pair == "")
                continue;

            var split3 = pair.Split(':');

            var key = split3[0];
            var value = split3[1];

            outputObject.Add(key, value);
        }

        return outputObject;
    }

    
}
*/