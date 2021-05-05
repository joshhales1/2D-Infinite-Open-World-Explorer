using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EntityManager : MonoBehaviour
{

    public string us;

    [SerializeField]
    GameObject square;

    [SerializeField]
    Sprite[] playerSprites;

    Dictionary<string, Sprite[]> typeSprites = new Dictionary<string, Sprite[]>();

    private readonly Dictionary<string, int> rotTranslation = new Dictionary<string, int> {
        { "01", 0},
        { "0-1", 2},
        { "10", 1},
        { "-10", 3},
    };

    Dictionary<string, GameObject> entities = new Dictionary<string, GameObject>();

    private List<Entity> entitiesToEdit = new List<Entity>();

    private void Start()
    {
        typeSprites.Add("player", playerSprites);
    }

    void Update()
    {
        if (entities.ContainsKey(us) && Camera.main.transform.parent == null)
        {
            Camera.main.transform.parent = entities[us].transform;
        }

        Entity[] entitesClone = entitiesToEdit.ToArray();
        entitiesToEdit.Clear();
        foreach (Entity e in entitesClone)
        {
            if (!entities.ContainsKey(e.ueid))
            {
                entities[e.ueid] = Instantiate(square);
            }

            if (e.dead)
            {
                Destroy(entities[e.ueid]);
                entities.Remove(e.ueid);

                return;
            }

            entities[e.ueid].transform.position = new Vector3(e.x, e.y, -1);

            if (typeSprites.ContainsKey(e.type))
            {
                entities[e.ueid].GetComponent<SpriteRenderer>().sprite = typeSprites[e.type][rotTranslation[e.facingX.ToString() + e.facingY.ToString()]];
            }

            
        }
    }

    public void UpdateEntity(int x, int y, string ueid, int facingX, int facingY, bool dead, string type)
    {
        entitiesToEdit.Add(
            new Entity
            {
                x = x,
                y = y,
                ueid = ueid,
                facingX = facingX,
                facingY = facingY,
                dead = dead,
                type = type
            }
        ) ;
    }

    struct Entity
    {
        public int x;
        public int y;
        public string ueid;
        public int facingX;
        public int facingY;
        public bool dead;
        public string type;
    }
}
