using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ChunkManager : MonoBehaviour
{
    private Dictionary<string, GameObject> chunks = new Dictionary<string, GameObject>();

    private List<Chunk> chunksToLoad = new List<Chunk>();
    private List<string> chunksToUnload = new List<string>();


    private struct Chunk
    {
        public string data;
        public int x;
        public int y;
        public string key;
    }

    [SerializeField]
    private GameObject tile;

    [SerializeField]
    private Sprite[] tileSprites;

    [SerializeField]
    private Sprite[] blockSprites;

    void Update()
    {
        Chunk[] newChunks = chunksToLoad.ToArray();
        string[] oldchunks = chunksToUnload.ToArray();
        chunksToLoad.Clear();
        chunksToUnload.Clear();

       
        foreach (Chunk c in newChunks)
        {
            GameObject chunk = new GameObject();

            if (chunks.ContainsKey(c.key))
            {
                Destroy(chunks[c.key]);

                chunks.Remove(c.key);
            }

            chunks.Add(c.key, chunk);

            chunk.transform.position = new Vector3(c.x * 16, c.y * 16);

            string[] rows = c.data.Split('/');

            for (int x = 0; x < 16; x++)
            {
                for (int y = 0; y < 16; y++)
                {
                    GameObject newTile = Instantiate(tile, chunk.transform, false);

                    newTile.transform.localPosition = new Vector3(x, y);

                    newTile.GetComponent<SpriteRenderer>().sprite = tileSprites[int.Parse(rows[x][2 * y + 1].ToString())];


                    if (int.Parse(rows[x][2 * y].ToString()) != 2)
                    {
                        GameObject newBlock = Instantiate(tile, chunk.transform, false);
                        newBlock.GetComponent<SpriteRenderer>().sprite = blockSprites[int.Parse(rows[x][2 * y].ToString())];
                        newBlock.transform.localPosition = new Vector3(x, y, -1);
                    }

                    
                }
            }
        }

        foreach (string key in oldchunks)
        {
            Destroy(chunks[key]);

            chunks.Remove(key);
        }

    }

    public void LoadChunk(string key, int xPos, int yPos, string data)
    {

        chunksToLoad.Add(new Chunk { 
            
            key = key,
            x = xPos,
            y = yPos,
            data = data
        
        });
        
    }

    public void UnloadChunk(string key)
    {
        if (chunks.ContainsKey(key))
            chunksToUnload.Add(key);
    }
}
