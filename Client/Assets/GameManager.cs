using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : MonoBehaviour
{

    ChunkManager chunkManager;
    EntityManager entityManager;

    void Start()
    {
        chunkManager = GetComponent<ChunkManager>();
        entityManager = GetComponent<EntityManager>();
    }

    public void OnMessage(Message m)
    {
        switch (m.head)
        {
            case "load_chunk":
                chunkManager.LoadChunk(m.values["key"].ToString(), int.Parse(m.values["x"].ToString()), int.Parse(m.values["y"].ToString()), m.values["data"].ToString());
                break;
            case "unload_chunk":
                chunkManager.UnloadChunk(m.values["key"].ToString());
                break;
            case "entity":
                entityManager.UpdateEntity(int.Parse(m.values["x"].ToString()), int.Parse(m.values["y"].ToString()), m.values["ueid"].ToString(), int.Parse(m.values["facingX"].ToString()), int.Parse(m.values["facingY"].ToString()), m.values["dead"].ToString() == "true", m.values["type"].ToString());
                break;
            case "you":
                entityManager.us = m.values["ueid"].ToString();
                break;


        }
    }
}
