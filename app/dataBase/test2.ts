import Firebird, { Base } from "../firebird";

const f = async (): Promise<void> => {
    // Тест Firebird
  
    const db = new Firebird(Base.ITM);
    const res = await db.executeOneRequest<{ID: number}>('select o.id from orders o where o.id = 18000');
    console.log(res[0].ID);
    db.dispouse();

}
f().then(() => {
    console.log('finish');
    
});